import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { staffLogout } from "@/lib/actions/auth";
import { db } from "@/lib/db";
import { Badge, Button, Select } from "@/components/ui";
import { CalendarDays, Download, Users } from "lucide-react";

const TONE: Record<string, "neutral" | "green" | "red" | "amber" | "blue"> = {
  SCHEDULED: "blue",
  CANCELED: "red",
  COMPLETED: "green",
  NO_SHOW: "amber",
};

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; statut?: string }>;
}) {
  const user = await requireStaff();
  const { service, statut } = await searchParams;

  // Scoping par service pour les agents
  const scopedIds: string[] = user.role === "AGENT" ? JSON.parse(user.serviceIds || "[]") : [];

  const services = await db.service.findMany({
    where: scopedIds.length ? { id: { in: scopedIds } } : {},
    orderBy: { order: "asc" },
  });

  const appointments = await db.appointment.findMany({
    where: {
      ...(statut ? { status: statut } : {}),
      ...(service ? { formality: { serviceId: service } } : scopedIds.length ? { formality: { serviceId: { in: scopedIds } } } : {}),
    },
    include: { applicant: true, formality: { include: { service: true } } },
    orderBy: { startAt: "desc" },
    take: 200,
  });

  const counts = await db.appointment.groupBy({ by: ["status"], _count: true });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Console de gestion — Rendez-vous</h1>
          <p className="text-sm text-stone-500">
            {user.name} · {user.role}
            {user.role === "AGENT" && ` · ${services.map((s) => s.name).join(", ")}`}
          </p>
        </div>
        <div className="flex gap-2">
          {user.role === "ADMIN" && (
            <Link href="/admin"><Button variant="outline">Console admin</Button></Link>
          )}
          <a href="/api/staff/export"><Button variant="outline"><Download className="h-4 w-4" /> Export CSV</Button></a>
          <form action={staffLogout}><Button variant="ghost">Déconnexion</Button></form>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {["SCHEDULED", "COMPLETED", "CANCELED", "NO_SHOW"].map((s) => (
          <div key={s} className="rounded-xl border border-stone-200 bg-white p-4 text-center">
            <div className="text-2xl font-bold">{counts.find((c) => c.status === s)?._count ?? 0}</div>
            <Badge tone={TONE[s]}>{s}</Badge>
          </div>
        ))}
      </div>

      <form className="mb-4 flex flex-wrap gap-2" method="get">
        <Select name="service" defaultValue={service ?? ""} className="w-auto">
          <option value="">Tous les services</option>
          {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <Select name="statut" defaultValue={statut ?? ""} className="w-auto">
          <option value="">Tous les statuts</option>
          {["SCHEDULED", "COMPLETED", "CANCELED", "NO_SHOW"].map((s) => <option key={s}>{s}</option>)}
        </Select>
        <Button type="submit" variant="outline">Filtrer</Button>
      </form>

      {appointments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
          <CalendarDays className="mx-auto mb-2 h-8 w-8 text-stone-300" />
          Aucun rendez-vous. Les réservations Calendly apparaîtront ici via le webhook
          (invitee.created), ou créez-en un de test depuis l'admin.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-stone-50 text-left text-xs uppercase text-stone-500">
              <tr>
                <th className="px-4 py-3">Date / heure</th>
                <th className="px-4 py-3">Usager</th>
                <th className="px-4 py-3">Service / Formalité</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id} className="border-b last:border-0 hover:bg-stone-50">
                  <td className="px-4 py-3">
                    {a.startAt ? a.startAt.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{a.applicant.firstName} {a.applicant.lastName}</div>
                    <div className="text-xs text-stone-500">{a.applicant.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{a.formality.service.name}</div>
                    <div className="text-xs text-stone-500">{a.formality.name}</div>
                  </td>
                  <td className="px-4 py-3"><Badge tone={TONE[a.status] ?? "neutral"}>{a.status}</Badge></td>
                  <td className="px-4 py-3 text-end">
                    <Link href={`/staff/usagers/${a.applicantId}`} className="inline-flex items-center gap-1 text-[var(--brand)] hover:underline">
                      <Users className="h-4 w-4" /> Fiche
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
