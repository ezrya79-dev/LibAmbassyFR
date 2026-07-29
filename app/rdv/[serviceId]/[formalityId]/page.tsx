import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, FileDown, Info, Mail } from "lucide-react";
import { db } from "@/lib/db";
import { t } from "@/lib/i18n";
import { getApplicant } from "@/lib/auth";
import { BookingWidget } from "@/components/booking-widget";
import { Card, Badge } from "@/components/ui";

export default async function FormalityPage({
  params,
}: {
  params: Promise<{ serviceId: string; formalityId: string }>;
}) {
  const { serviceId, formalityId } = await params;
  const dict = await t();
  const [formality, applicant, hasRules] = await Promise.all([
    db.formality.findUnique({
      where: { id: formalityId },
      include: { requiredDocuments: { orderBy: { order: "asc" } }, service: true },
    }),
    getApplicant(),
    db.availabilityRule
      .count({ where: { serviceId, active: true } })
      .then((n) => n > 0),
  ]);
  if (!formality || formality.serviceId !== serviceId) notFound();

  const hasContent = formality.requiredDocuments.length > 0 || formality.content;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/rdv/${serviceId}`} className="text-sm text-stone-500 hover:underline">
        ← {dict.back} ({formality.service.name})
      </Link>
      <h1 className="mt-2 text-2xl font-bold">{formality.name}</h1>
      <p className="mt-1 text-sm text-stone-500">
        {dict.step} 3/3 — {dict.calendarStep}
      </p>

      {formality.description?.includes("[À COMPLÉTER]") && (
        <Card className="mt-4 border-amber-200 bg-amber-50">
          <div className="flex gap-3 text-sm text-amber-900">
            <Info className="h-5 w-5 shrink-0" />
            <p>{formality.description}</p>
          </div>
        </Card>
      )}

      {formality.service.formUrl && (
        <a
          href={formality.service.formUrl}
          target="_blank"
          rel="noopener"
          className="mt-4 flex items-center gap-3 rounded-xl border border-[var(--brand)] bg-[var(--brand-light)] p-4 transition-shadow hover:shadow-md"
        >
          <FileDown className="h-6 w-6 shrink-0 text-[var(--brand)]" />
          <div>
            <div className="font-semibold text-[var(--brand)]">{dict.downloadForm}</div>
            <div className="text-xs text-stone-600">{dict.downloadFormHint}</div>
          </div>
        </a>
      )}

      {formality.requiredDocuments.length > 0 && (
        <Card className="mt-6">
          <h2 className="font-semibold">{dict.requiredDocs}</h2>
          <ul className="mt-3 space-y-2">
            {formality.requiredDocuments.map((d) => (
              <li key={d.id} className="flex gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand)]" />
                <span>{d.label}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {formality.content && (
        <Card className="prose-content mt-4">
          <div className="whitespace-pre-line text-sm text-stone-700">{formality.content}</div>
        </Card>
      )}

      {(formality.taxDetail || formality.emailContact) && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {formality.taxDetail && <Badge tone="green">{dict.consularTax} : {formality.taxDetail}</Badge>}
          {formality.emailContact && (
            <a href={`mailto:${formality.emailContact}`} className="inline-flex items-center gap-1 text-sm text-stone-600 hover:underline">
              <Mail className="h-4 w-4" /> {formality.emailContact}
            </a>
          )}
        </div>
      )}

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">{dict.book}</h2>
        {hasRules ? (
          <BookingWidget
            formalityId={formality.id}
            serviceId={serviceId}
            prefill={
              applicant
                ? {
                    firstName: applicant.firstName,
                    lastName: applicant.lastName,
                    email: applicant.email,
                    phone: applicant.phone ?? undefined,
                  }
                : undefined
            }
            labels={{
              chooseSlot: dict.chooseSlot,
              noSlots: dict.noSlots,
              prevPeriod: dict.prevPeriod,
              nextPeriod: dict.nextPeriod,
              yourDetails: dict.yourDetails,
              firstName: dict.firstName,
              lastName: dict.lastName,
              email: dict.email,
              phone: dict.phone,
              confirmBooking: dict.confirmBooking,
              bookingNotDoneYet: dict.bookingNotDoneYet,
              selectedSlot: dict.selectedSlot,
              changeSlot: dict.changeSlot,
              remainingPlaces: dict.remainingPlaces,
            }}
          />
        ) : (
          <Card className="text-sm text-stone-600">
            {hasContent
              ? "La prise de rendez-vous en ligne pour cette formalité sera bientôt disponible. Merci de contacter le service par email."
              : "Merci de contacter le service par email pour cette formalité."}
            {formality.emailContact && (
              <>
                {" "}
                <a className="font-medium underline" href={`mailto:${formality.emailContact}`}>
                  {formality.emailContact}
                </a>
              </>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
