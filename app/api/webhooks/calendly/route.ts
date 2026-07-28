import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";

// POST /api/webhooks/calendly — réception des événements Calendly (signature vérifiée)
export async function POST(req: NextRequest) {
  const body = await req.text();

  // Vérification de la signature HMAC (Calendly-Webhook-Signature: t=...,v1=...)
  const signingKey =
    process.env.CALENDLY_WEBHOOK_SIGNING_KEY ||
    (await db.calendlyConnection.findUnique({ where: { singleton: "main" } }))?.webhookSigningKey;

  if (signingKey) {
    const header = req.headers.get("Calendly-Webhook-Signature") ?? "";
    const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
    const expected = crypto.createHmac("sha256", signingKey).update(`${parts.t}.${body}`).digest("hex");
    // timingSafeEqual lève si les longueurs diffèrent : on compare d'abord la
    // taille, sinon une signature tronquée provoquerait une 500 au lieu d'un 401.
    const provided = Buffer.from(parts.v1 ?? "", "utf8");
    const reference = Buffer.from(expected, "utf8");
    if (
      !parts.t ||
      !parts.v1 ||
      provided.length !== reference.length ||
      !crypto.timingSafeEqual(reference, provided)
    ) {
      return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Clé de signature non configurée" }, { status: 500 });
  }

  const payload = JSON.parse(body);
  const event: string = payload.event;
  const p = payload.payload ?? {};

  try {
    if (event === "invitee.created" || event === "invitee.canceled") {
      const inviteeUri: string | undefined = p.uri;
      const email: string | undefined = p.email?.toLowerCase();
      const name: string = p.name ?? "";
      const scheduled = p.scheduled_event ?? {};
      const eventTypeUri: string | undefined = scheduled.event_type;
      const startAt = scheduled.start_time ? new Date(scheduled.start_time) : null;
      const endAt = scheduled.end_time ? new Date(scheduled.end_time) : null;

      // Formalité correspondante via l'Event Type URI
      const formality = eventTypeUri
        ? await db.formality.findFirst({ where: { calendlyEventTypeUri: eventTypeUri } })
        : null;

      if (email) {
        const [firstName, ...rest] = name.split(" ");
        const applicant = await db.applicant.upsert({
          where: { email },
          create: { email, firstName: firstName ?? "", lastName: rest.join(" ") },
          update: {},
        });

        const existing = inviteeUri
          ? await db.appointment.findFirst({ where: { calendlyInviteeUri: inviteeUri } })
          : null;

        if (event === "invitee.created" && !existing) {
          await db.appointment.create({
            data: {
              applicantId: applicant.id,
              formalityId: formality?.id ?? (await fallbackFormalityId()),
              calendlyEventUri: scheduled.uri,
              calendlyInviteeUri: inviteeUri,
              status: "SCHEDULED",
              startAt,
              endAt,
            },
          });
        } else if (existing) {
          await db.appointment.update({
            where: { id: existing.id },
            data: {
              status: event === "invitee.canceled" ? "CANCELED" : "SCHEDULED",
              startAt: startAt ?? existing.startAt,
              endAt: endAt ?? existing.endAt,
            },
          });
        }

        await db.auditLog.create({
          data: { action: `CALENDLY_${event.toUpperCase().replace(".", "_")}`, target: email, meta: JSON.stringify({ eventTypeUri, startAt }) },
        });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[webhook calendly]", e);
    return NextResponse.json({ error: "Traitement échoué" }, { status: 500 });
  }
}

async function fallbackFormalityId(): Promise<string> {
  const any = await db.formality.findFirst({ orderBy: { order: "asc" } });
  if (!any) throw new Error("Aucune formalité configurée");
  return any.id;
}
