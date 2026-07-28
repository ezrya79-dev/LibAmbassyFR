import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Mail } from "lucide-react";
import { db } from "@/lib/db";
import { t } from "@/lib/i18n";
import { Card } from "@/components/ui";

export default async function ServicePage({ params }: { params: Promise<{ serviceId: string }> }) {
  const { serviceId } = await params;
  const dict = await t();
  const service = await db.service.findUnique({
    where: { id: serviceId },
    include: { formalities: { where: { active: true }, orderBy: { order: "asc" } } },
  });
  if (!service) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/rdv" className="text-sm text-stone-500 hover:underline">
        ← {dict.back}
      </Link>
      <h1 className="mt-2 text-2xl font-bold">{service.name}</h1>
      <p className="mt-1 text-sm text-stone-500">
        {dict.step} 2/3 — {dict.selectFormality}
      </p>

      <div className="mt-6 space-y-3">
        {service.formalities.map((f, i) => (
          <Link
            key={f.id}
            href={`/rdv/${service.id}/${f.id}`}
            className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition-all hover:border-[var(--brand)] hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-light)] text-sm font-bold text-[var(--brand)]">
                {i + 1}
              </span>
              <div>
                <div className="font-medium">{f.name}</div>
                {f.taxDetail && <div className="text-xs text-stone-500">{dict.consularTax} : {f.taxDetail}</div>}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-stone-400" />
          </Link>
        ))}
      </div>

      {service.banner && (
        <Card className="mt-8 border-blue-200 bg-blue-50">
          <div className="flex gap-3">
            <Mail className="h-5 w-5 shrink-0 text-blue-600" />
            <div className="whitespace-pre-line text-sm text-blue-900">{service.banner}</div>
          </div>
        </Card>
      )}
    </div>
  );
}
