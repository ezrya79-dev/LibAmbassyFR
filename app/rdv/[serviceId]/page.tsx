import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, FileDown, Info, Mail } from "lucide-react";
import { db } from "@/lib/db";
import { t } from "@/lib/i18n";
import { Stepper } from "@/components/stepper";

export default async function ServicePage({ params }: { params: Promise<{ serviceId: string }> }) {
  const { serviceId } = await params;
  const dict = await t();
  const service = await db.service.findUnique({
    where: { id: serviceId },
    include: { formalities: { where: { active: true }, orderBy: { order: "asc" } } },
  });
  if (!service) notFound();

  // Notes communes éventuelles du service (ex. procurations) — contenu éditorial paramétrable
  const notes = await db.contentBlock.findUnique({
    where: { key_locale: { key: `service.${service.slug}.notes`, locale: "fr" } },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <Stepper current={2} />

      <Link href="/rdv" className="inline-flex min-h-11 items-center text-sm text-outline hover:underline">
        ← {dict.back}
      </Link>
      <h1 className="mt-2 text-center text-3xl font-bold text-primary">{service.name}</h1>
      <p className="mt-2 text-center text-on-surface-variant">{dict.selectFormality}</p>

      {/* Formulaire téléchargeable « en haut de la page », comme sur le
          portail d'origine (Requirements §04). */}
      {service.formUrl && (
        <a
          href={service.formUrl}
          target="_blank"
          rel="noopener"
          className="mt-6 flex items-center gap-3 rounded-xl border border-primary bg-brand-light p-4 transition-shadow hover:shadow-sm"
        >
          <FileDown className="h-6 w-6 shrink-0 text-primary" />
          <div>
            <div className="font-semibold text-primary">{dict.downloadForm}</div>
            <div className="text-xs text-on-surface-variant">{dict.downloadFormHint}</div>
          </div>
        </a>
      )}

      <div className="mt-6 space-y-3">
        {service.formalities.map((f, i) => (
          <Link
            key={f.id}
            href={`/rdv/${service.id}/${f.id}`}
            className="flex min-h-[72px] items-center justify-between rounded-xl border border-border-muted bg-white p-5 transition-all hover:border-primary hover:shadow-sm"
          >
            <div className="flex items-center gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-light text-sm font-bold text-primary">
                {i + 1}
              </span>
              <div>
                <div className="font-semibold">{f.name}</div>
                {f.taxDetail && (
                  <div className="mt-0.5 text-xs text-on-surface-variant">
                    {dict.consularTax} : {f.taxDetail}
                  </div>
                )}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-outline" />
          </Link>
        ))}
      </div>

      {notes && (
        <div className="mt-8 flex gap-3 rounded-xl border border-status-amber/30 bg-amber-50 p-5">
          <Info className="h-5 w-5 shrink-0 text-status-amber" />
          <div>
            <div className="text-sm font-semibold text-amber-900">{notes.title ?? dict.importantNote}</div>
            <div className="mt-1 whitespace-pre-line text-sm text-amber-900">{notes.body}</div>
          </div>
        </div>
      )}

      {service.banner && (
        <div className="mt-6 flex gap-3 rounded-xl border border-status-blue/20 bg-blue-50 p-5">
          <Mail className="h-5 w-5 shrink-0 text-status-blue" />
          <div className="whitespace-pre-line text-sm text-blue-900">{service.banner}</div>
        </div>
      )}
    </div>
  );
}
