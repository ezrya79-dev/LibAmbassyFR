import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, FileDown, Info, Mail, Banknote } from "lucide-react";
import { db } from "@/lib/db";
import { t } from "@/lib/i18n";
import { getApplicant } from "@/lib/auth";
import { BookingWidget } from "@/components/booking-widget";
import { Stepper } from "@/components/stepper";

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
      <Stepper current={3} />

      <Link href={`/rdv/${serviceId}`} className="text-sm text-outline hover:underline">
        ← {dict.back} ({formality.service.name})
      </Link>
      <h1 className="mt-2 text-center text-2xl font-bold text-primary sm:text-3xl">{formality.name}</h1>
      <p className="mt-2 text-center text-on-surface-variant">{dict.calendarStep}</p>

      {formality.description?.includes("[À COMPLÉTER]") && (
        <div className="mt-4 flex gap-3 rounded-xl border border-status-amber/30 bg-amber-50 p-4 text-sm text-amber-900">
          <Info className="h-5 w-5 shrink-0 text-status-amber" />
          <p>{formality.description}</p>
        </div>
      )}

      {/* Formulaire téléchargeable « en haut de la page » (Requirements §04). */}
      {formality.service.formUrl && (
        <a
          href={formality.service.formUrl}
          target="_blank"
          rel="noopener"
          className="mt-4 flex items-center gap-3 rounded-xl border border-primary bg-brand-light p-4 transition-shadow hover:shadow-sm"
        >
          <FileDown className="h-6 w-6 shrink-0 text-primary" />
          <div>
            <div className="font-semibold text-primary">{dict.downloadForm}</div>
            <div className="text-xs text-on-surface-variant">{dict.downloadFormHint}</div>
          </div>
        </a>
      )}

      {formality.requiredDocuments.length > 0 && (
        <div className="mt-6 rounded-xl border border-border-muted bg-white p-6">
          <h2 className="font-semibold text-primary">{dict.requiredDocs}</h2>
          <ul className="mt-4 space-y-3">
            {formality.requiredDocuments.map((d) => (
              <li key={d.id} className="flex gap-3 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-container" />
                <span>{d.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {formality.content && (
        <div className="prose-content mt-4 rounded-xl border border-border-muted bg-white p-6">
          <div className="whitespace-pre-line text-sm text-on-surface-variant">{formality.content}</div>
        </div>
      )}

      {(formality.taxDetail || formality.emailContact) && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {formality.taxDetail && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3 py-1 text-sm font-medium text-primary">
              <Banknote className="h-4 w-4" /> {dict.consularTax} : {formality.taxDetail}
            </span>
          )}
          {formality.emailContact && (
            <a
              href={`mailto:${formality.emailContact}`}
              className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:underline"
            >
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
          <div className="rounded-xl border border-border-muted bg-white p-6 text-sm text-on-surface-variant">
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
          </div>
        )}
      </div>
    </div>
  );
}
