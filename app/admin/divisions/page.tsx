import { requireAdmin } from "@/lib/auth";
import { addDivision, deleteDivision, importDivisionsCsv } from "@/lib/actions/admin";
import { db } from "@/lib/db";
import { AdminNav } from "@/components/admin-nav";
import { Button, Card, Input, Label, Select, Textarea } from "@/components/ui";

export default async function AdminDivisionsPage() {
  await requireAdmin();
  const divisions = await db.adminDivision.findMany({ orderBy: [{ level: "asc" }, { name: "asc" }] });
  const mouhafazas = divisions.filter((d) => d.level === 1);
  const kazas = divisions.filter((d) => d.level === 2);
  const communes = divisions.filter((d) => d.level === 3);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Divisions administratives</h1>
      <AdminNav current="/admin/divisions" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">Arborescence ({divisions.length} entrées)</h2>
          <div className="max-h-[32rem] space-y-3 overflow-y-auto pr-2 text-sm">
            {mouhafazas.map((m) => (
              <div key={m.id}>
                <div className="flex items-center justify-between font-semibold">
                  {m.name}
                  <form action={deleteDivision.bind(null, m.id)}>
                    <button className="text-xs font-normal text-red-500 hover:underline">supprimer</button>
                  </form>
                </div>
                <ul className="ms-4 mt-1 space-y-1">
                  {kazas.filter((k) => k.parentId === m.id).map((k) => (
                    <li key={k.id}>
                      <div className="flex items-center justify-between">
                        <span>▸ {k.name}</span>
                        <form action={deleteDivision.bind(null, k.id)}>
                          <button className="text-xs text-red-500 hover:underline">supprimer</button>
                        </form>
                      </div>
                      <div className="ms-4 text-xs text-stone-500">
                        {communes.filter((c) => c.parentId === k.id).map((c) => c.name).join(", ") || "—"}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 font-semibold">Ajouter une division</h2>
            <form action={addDivision} className="grid gap-3">
              <div>
                <Label>Niveau</Label>
                <Select name="level" defaultValue="3">
                  <option value="1">Mouhafaza</option>
                  <option value="2">Kaza</option>
                  <option value="3">Commune</option>
                </Select>
              </div>
              <div>
                <Label>Parent (ID — laisser vide pour une Mouhafaza)</Label>
                <Input name="parentId" placeholder="ID du Kaza parent…" />
                <p className="mt-1 text-xs text-stone-400">Astuce : privilégiez l'import CSV ci-dessous pour les ajouts en masse.</p>
              </div>
              <div><Label>Nom</Label><Input name="name" required /></div>
              <Button type="submit">Ajouter</Button>
            </form>
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold">Import CSV (communes complètes)</h2>
            <p className="mb-2 text-xs text-stone-500">
              Une ligne par entrée, format : <code>Mouhafaza;Kaza;Commune</code>. Les niveaux existants sont réutilisés,
              les manquants créés. Idéal pour importer la liste complète des ~1000 communes.
            </p>
            <form action={importDivisionsCsv} className="grid gap-3">
              <Textarea
                name="csv"
                rows={8}
                placeholder={"Mont-Liban;Metn;Bikfaya\nMont-Liban;Metn;Baskinta\nNabatieh;Bint-Jbeil;Ain Ebel"}
                className="font-mono text-xs"
                required
              />
              <Button type="submit">Importer</Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
