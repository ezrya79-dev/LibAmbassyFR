import Link from "next/link";
import { Book, FileText, Stamp, ScrollText, PenLine, ChevronRight, AlertTriangle } from "lucide-react";
import { db } from "@/lib/db";
import { t } from "@/lib/i18n";
import { DepartmentGate } from "@/components/department-gate";
import { Stepper } from "@/components/stepper";

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
      <Stepper current={1} />

      <h1 className="text-center text-3xl font-bold text-primary">{dict.bookAppointment}</h1>
      <p className="mt-2 text-center text-on-surface-variant">{dict.selectService}</p>

      {rules.length > 0 && (
        <div className="mt-6 flex gap-3 rounded-xl border border-status-amber/30 bg-amber-50 p-4 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 text-status-amber" />
          <div className="text-amber-900">
            <span className="font-semibold">{dict.importantNote} — </span>
            {rules[0].message}
          </div>
        </div>
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
          <div className="space-y-3">
            {services.map((s) => {
              const Icon = ICONS[s.icon ?? ""] ?? FileText;
              return (
                <Link
                  key={s.id}
                  href={`/rdv/${s.id}`}
                  className="flex min-h-[72px] items-center gap-4 rounded-xl border border-border-muted bg-white p-5 transition-all hover:border-primary hover:shadow-sm"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-light">
                    <Icon className="h-6 w-6 text-primary" strokeWidth={1.75} />
                  </span>
                  <span className="flex-1 text-lg font-semibold">{s.name}</span>
                  <ChevronRight className="h-5 w-5 text-outline" />
                </Link>
              );
            })}
          </div>

          {intro && (
            <p className="mt-6 whitespace-pre-line text-center text-sm text-outline">{intro.body}</p>
          )}
        </DepartmentGate>
      </div>
    </div>
  );
}
