import Link from "next/link";
import { Book, FileText, Stamp, ScrollText, PenLine, AlertTriangle } from "lucide-react";
import { db } from "@/lib/db";
import { t } from "@/lib/i18n";
import { DepartmentGate } from "@/components/department-gate";
import { Card } from "@/components/ui";

const ICONS: Record<string, typeof Book> = {
  book: Book,
  "file-text": FileText,
  stamp: Stamp,
  scroll: ScrollText,
  "pen-line": PenLine,
};

export default async function RdvPage() {
  const dict = await t();
  const [services, rules, intro] = await Promise.all([
    db.service.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
    db.departmentRedirectRule.findMany({ where: { active: true } }),
    db.contentBlock.findUnique({ where: { key_locale: { key: "rdv.intro.steps", locale: "fr" } } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">{dict.bookAppointment}</h1>
      <p className="mt-1 text-sm text-stone-500">
        {dict.step} 1/3 — {dict.selectService}
      </p>

      {intro && (
        <Card className="mt-6 border-l-4 border-l-[var(--brand)]">
          <div className="whitespace-pre-line text-sm text-stone-600">{intro.body}</div>
        </Card>
      )}

      <div className="mt-6">
        <DepartmentGate
          rules={rules}
          labels={{
            yourDepartment: dict.yourDepartment,
            departmentHint: dict.departmentHint,
            checkDepartment: dict.checkDepartment,
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {services.map((s) => {
              const Icon = ICONS[s.icon ?? ""] ?? FileText;
              return (
                <Link
                  key={s.id}
                  href={`/rdv/${s.id}`}
                  className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition-all hover:border-[var(--brand)] hover:shadow-md"
                >
                  <Icon className="h-8 w-8 shrink-0 text-[var(--brand)]" strokeWidth={1.5} />
                  <span className="font-semibold">{s.name}</span>
                </Link>
              );
            })}
          </div>
        </DepartmentGate>
      </div>

      {rules.length > 0 && (
        <Card className="mt-8 border-amber-200 bg-amber-50">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <div className="text-sm text-amber-900">
              <div className="font-semibold">{dict.importantNote}</div>
              <p className="mt-1">{rules[0].message}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
