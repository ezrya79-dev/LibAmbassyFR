import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Landmark,
  Mail,
  Settings2,
} from "lucide-react";
import { db } from "@/lib/db";
import { t } from "@/lib/i18n";
import { BOOKING_TZ } from "@/lib/booking";
import { Card } from "@/components/ui";

// Écran final du parcours : c'est ICI (et seulement ici) que l'usager reçoit
// le récapitulatif complet — date, durée, adresse, pièces à apporter, taxe,
// référence. Le RDV est réellement enregistré : aucune ambiguïté possible.
export default async function ConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { reference } = await params;
  const { t: token } = await searchParams;
  const dict = await t();

  const appt = await db.appointment.findUnique({
    where: { reference: decodeURIComponent(reference).toUpperCase() },
    include: {
      applicant: true,
      formality: {
        include: {
          requiredDocuments: { orderBy: { order: "asc" } },
          service: { include: { entity: true } },
        },
      },
    },
  });
  // Le jeton du lien est exigé : la référence seule ne suffit pas à lire un RDV.
  if (!appt || !appt.manageToken || appt.manageToken !== token || !appt.startAt || !appt.endAt) notFound();

  const entity = appt.formality.service.entity;
  const dateLabel = appt.startAt.toLocaleString("fr-FR", {
    timeZone: BOOKING_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const durationMin = Math.round((appt.endAt.getTime() - appt.startAt.getTime()) / 60000);
  const manageHref = `/rdv/gestion?ref=${appt.reference}&t=${appt.manageToken}`;
  const canceled = appt.status === "CANCELED";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 text-center">
        <CheckCircle2
          className={`mx-auto h-14 w-14 ${canceled ? "text-stone-300" : "text-[var(--brand)]"}`}
          strokeWidth={1.5}
        />
        <h1 className="mt-3 text-2xl font-bold">
          {canceled ? dict.bookingCanceled : dict.bookingConfirmed}
        </h1>
        {!canceled && <p className="mt-1 text-sm text-stone-500">{dict.bookingConfirmedNote}</p>}
      </div>

      <Card className={canceled ? "opacity-60" : ""}>
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div>
            <div className="text-xs uppercase text-stone-500">{dict.reference}</div>
            <div className="text-xl font-bold tracking-wider text-[var(--brand)]">{appt.reference}</div>
          </div>
          <div className="text-end text-sm text-stone-600">
            {appt.applicant.firstName} {appt.applicant.lastName}
            <div className="text-xs text-stone-400">{appt.applicant.email}</div>
          </div>
        </div>

        <dl className="mt-4 space-y-4 text-sm">
          <div className="flex gap-3">
            <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand)]" />
            <div>
              <dt className="font-semibold">{dict.dateTime}</dt>
              <dd className="capitalize text-stone-700">{dateLabel}</dd>
            </div>
          </div>
          <div className="flex gap-3">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand)]" />
            <div>
              <dt className="font-semibold">{dict.duration}</dt>
              <dd className="text-stone-700">
                {durationMin} {dict.minutes} — {appt.formality.service.name} · {appt.formality.name}
              </dd>
            </div>
          </div>
          <div className="flex gap-3">
            <Landmark className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand)]" />
            <div>
              <dt className="font-semibold">{dict.address}</dt>
              <dd className="text-stone-700">
                {entity.name}
                <br />
                {entity.address}
                <br />
                <span className="text-stone-500">{entity.openingHours}</span>
              </dd>
            </div>
          </div>
          {appt.formality.requiredDocuments.length > 0 && (
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand)]" />
              <div>
                <dt className="font-semibold">{dict.docsToBring}</dt>
                <dd>
                  <ul className="mt-1 list-disc space-y-1 ps-4 text-stone-700">
                    {appt.formality.requiredDocuments.map((d) => (
                      <li key={d.id}>{d.label}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            </div>
          )}
          {appt.formality.taxDetail && (
            <div className="flex gap-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand)]" />
              <div>
                <dt className="font-semibold">{dict.consularTax}</dt>
                <dd className="text-stone-700">{appt.formality.taxDetail}</dd>
              </div>
            </div>
          )}
        </dl>
      </Card>

      {!canceled && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a
            href={`/api/rdv/ics?ref=${appt.reference}&t=${appt.manageToken}`}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-dark)]"
          >
            <CalendarPlus className="h-4 w-4" /> {dict.addToCalendar}
          </a>
          <Link
            href={manageHref}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium hover:bg-stone-100"
          >
            <Settings2 className="h-4 w-4" /> {dict.manageBooking}
          </Link>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-stone-400">
        {entity.phone} · {entity.email}
      </p>
    </div>
  );
}
