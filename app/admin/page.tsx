import { requireAdmin } from "@/lib/auth";
import { staffLogout } from "@/lib/actions/auth";
import { createTestAppointment } from "@/lib/actions/admin";
import { db } from "@/lib/db";
import { AdminNav } from "@/components/admin-nav";
import { Button, Card } from "@/components/ui";
import Link from "next/link";

export default async function AdminPage() {
  const user = await requireAdmin();
  const [total, canceled, completed, applicants, docs, services] = await Promise.all([
    db.appointment.count(),
    db.appointment.count({ where: { status: "CANCELED" } }),
    db.appointment.findMany({ where: { status: "COMPLETED" }, select: { createdAt: true, startAt: true } }),
    db.applicant.count(),
    db.document.count(),
    db.service.count({ where: { active: true } }),
  ]);

  // Délai moyen de traitement (création → date du RDV) en jours
  const avgDays = completed.length
    ? completed.reduce((acc, a) => acc + (a.startAt && a.createdAt ? (a.startAt.getTime() - a.createdAt.getTime()) / 86400000 : 0), 0) / completed.length
    : 0;

  const stats = [
    { label: "Rendez-vous total", value: total },
    { label: "Taux d'annulation", value: total ? `${Math.round((canceled / total) * 100)} %` : "—" },
    { label: "Délai moyen de traitement", value: completed.length ? `${avgDays.toFixed(1)} j` : "—" },
    { label: "Usagers", value: applicants },
    { label: "Documents déposés", value: docs },
    { label: "Services actifs", value: services },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Console de paramétrage</h1>
          <p className="text-sm text-stone-500">{user.name} · {user.role}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/staff"><Button variant="outline">Console employés</Button></Link>
          <form action={createTestAppointment}><Button variant="outline">+ RDV de test</Button></form>
          <form action={staffLogout}><Button variant="ghost">Déconnexion</Button></form>
        </div>
      </div>

      <AdminNav current="/admin" />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="text-center">
            <div className="text-3xl font-bold text-[var(--brand)]">{s.value}</div>
            <div className="mt-1 text-sm text-stone-500">{s.label}</div>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <h2 className="mb-2 font-semibold">Journal d'audit (20 dernières actions)</h2>
        <AuditList />
      </Card>
    </div>
  );
}

async function AuditList() {
  const logs = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
  if (logs.length === 0) return <p className="text-sm text-stone-500">Aucune action enregistrée.</p>;
  return (
    <ul className="space-y-1 text-xs">
      {logs.map((l) => (
        <li key={l.id} className="flex justify-between gap-4 border-b border-stone-100 py-1 last:border-0">
          <span className="font-mono">{l.action}</span>
          <span className="truncate text-stone-500">{l.target}</span>
          <span className="text-stone-400">{l.createdAt.toLocaleString("fr-FR")}</span>
        </li>
      ))}
    </ul>
  );
}
