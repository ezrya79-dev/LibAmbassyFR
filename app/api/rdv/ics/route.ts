import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function icsEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

// GET /api/rdv/ics?ref=LB-XXXXXX&t=<manageToken> — « Ajouter à mon calendrier »
export async function GET(req: NextRequest) {
  const ref = (req.nextUrl.searchParams.get("ref") ?? "").trim().toUpperCase();
  const token = req.nextUrl.searchParams.get("t") ?? "";

  const appt = ref
    ? await db.appointment.findUnique({
        where: { reference: ref },
        include: { formality: { include: { service: { include: { entity: true } } } } },
      })
    : null;
  if (!appt || !appt.manageToken || appt.manageToken !== token || !appt.startAt || !appt.endAt) {
    return NextResponse.json({ error: "Rendez-vous introuvable" }, { status: 404 });
  }

  const entity = appt.formality.service.entity;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LibAmbassyFR//RDV//FR",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${appt.reference}@libambassyfr`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(appt.startAt)}`,
    `DTEND:${icsDate(appt.endAt)}`,
    `SUMMARY:${icsEscape(`${entity.name} — ${appt.formality.name}`)}`,
    `LOCATION:${icsEscape(entity.address)}`,
    `DESCRIPTION:${icsEscape(
      `Référence : ${appt.reference}\nService : ${appt.formality.service.name}\nMerci de vous présenter à l'heure exacte, muni de tous les documents nécessaires (originaux et copies) ainsi que du montant de la taxe consulaire en espèces.`
    )}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="rdv-${appt.reference}.ics"`,
    },
  });
}
