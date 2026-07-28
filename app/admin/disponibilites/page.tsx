import { requireAdmin } from "@/lib/auth";
import {
  deleteAvailabilityRule,
  deleteClosedPeriod,
  saveAvailabilityRule,
  saveClosedPeriod,
} from "@/lib/actions/admin";
import { db } from "@/lib/db";
import { AdminNav } from "@/components/admin-nav";
import { Badge, Button, Card, Input, Label, Select } from "@/components/ui";

const WEEKDAYS = ["", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const hm = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

// Gestion des plages d'ouverture du moteur de créneaux natif : c'est ici que
// les employés adaptent le calendrier (au lieu de Calendly).
export default async function AdminDisponibilitesPage() {
  await requireAdmin();
  const [services, closed] = await Promise.all([
    db.service.findMany({
      orderBy: { order: "asc" },
      include: { availabilityRules: { orderBy: [{ weekday: "asc" }, { startMinute: "asc" }] } },
    }),
    db.closedPeriod.findMany({ orderBy: { startDate: "asc" }, include: { service: true } }),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Disponibilités & créneaux</h1>
      <AdminNav current="/admin/disponibilites" />

      <p className="mb-6 text-sm text-stone-500">
        Chaque règle ouvre une plage hebdomadaire de rendez-vous pour un service (heure de Paris).
        Les créneaux proposés aux usagers sont générés automatiquement : durée du rendez-vous,
        nombre de guichets en parallèle, fermetures exceptionnelles ci-dessous.
      </p>

      {services.map((s) => (
        <Card key={s.id} className="mb-4">
          <h2 className="mb-3 font-semibold">{s.name}</h2>

          {s.availabilityRules.length > 0 && (
            <div className="mb-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-stone-500">
                  <tr>
                    <th className="py-2 pe-4">Jour</th>
                    <th className="py-2 pe-4">Plage</th>
                    <th className="py-2 pe-4">Durée RDV</th>
                    <th className="py-2 pe-4">Guichets</th>
                    <th className="py-2 pe-4">État</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {s.availabilityRules.map((r) => (
                    <tr key={r.id} className="border-t border-stone-100">
                      <td className="py-2 pe-4">{WEEKDAYS[r.weekday]}</td>
                      <td className="py-2 pe-4">
                        {hm(r.startMinute)} – {hm(r.endMinute)}
                      </td>
                      <td className="py-2 pe-4">{r.slotMinutes} min</td>
                      <td className="py-2 pe-4">{r.capacity}</td>
                      <td className="py-2 pe-4">
                        <Badge tone={r.active ? "green" : "neutral"}>{r.active ? "active" : "inactive"}</Badge>
                      </td>
                      <td className="py-2 text-end">
                        <form action={deleteAvailabilityRule.bind(null, r.id)}>
                          <Button variant="ghost" type="submit" className="text-red-600">
                            Supprimer
                          </Button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <form action={saveAvailabilityRule} className="grid items-end gap-3 sm:grid-cols-6">
            <input type="hidden" name="serviceId" value={s.id} />
            <input type="hidden" name="active" value="true" />
            <div>
              <Label>Jour</Label>
              <Select name="weekday" defaultValue="1">
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <option key={d} value={d}>
                    {WEEKDAYS[d]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>De</Label>
              <Input name="start" type="time" defaultValue="09:00" required />
            </div>
            <div>
              <Label>À</Label>
              <Input name="end" type="time" defaultValue="14:00" required />
            </div>
            <div>
              <Label>Durée (min)</Label>
              <Input name="slotMinutes" type="number" min={5} step={5} defaultValue={20} required />
            </div>
            <div>
              <Label>Guichets</Label>
              <Input name="capacity" type="number" min={1} defaultValue={1} required />
            </div>
            <div>
              <Button type="submit" className="w-full">
                Ajouter
              </Button>
            </div>
          </form>
        </Card>
      ))}

      <Card>
        <h2 className="mb-3 font-semibold">Fermetures exceptionnelles</h2>
        {closed.length > 0 && (
          <ul className="mb-4 space-y-2 text-sm">
            {closed.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-lg border border-stone-100 px-3 py-2">
                <span>
                  {c.startDate}
                  {c.endDate !== c.startDate && ` → ${c.endDate}`} · {c.service?.name ?? "Tous les services"}
                  {c.reason && <span className="text-stone-500"> — {c.reason}</span>}
                </span>
                <form action={deleteClosedPeriod.bind(null, c.id)}>
                  <Button variant="ghost" type="submit" className="text-red-600">
                    Supprimer
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form action={saveClosedPeriod} className="grid items-end gap-3 sm:grid-cols-5">
          <div>
            <Label>Du</Label>
            <Input name="startDate" type="date" required />
          </div>
          <div>
            <Label>Au (inclus)</Label>
            <Input name="endDate" type="date" />
          </div>
          <div>
            <Label>Service</Label>
            <Select name="serviceId" defaultValue="">
              <option value="">Tous les services</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Motif</Label>
            <Input name="reason" placeholder="Jour férié…" />
          </div>
          <div>
            <Button type="submit" className="w-full">
              Ajouter
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
