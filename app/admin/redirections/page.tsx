import { requireAdmin } from "@/lib/auth";
import { saveRedirectRule, deleteRedirectRule } from "@/lib/actions/admin";
import { db } from "@/lib/db";
import { AdminNav } from "@/components/admin-nav";
import { Button, Card, Input, Label, Textarea, Badge } from "@/components/ui";

export default async function AdminRedirectionsPage() {
  await requireAdmin();
  const rules = await db.departmentRedirectRule.findMany();

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Règles de redirection par département</h1>
      <AdminNav current="/admin/redirections" />

      {rules.map((r) => (
        <Card key={r.id} className="mb-4">
          <form action={saveRedirectRule} className="grid gap-3">
            <input type="hidden" name="id" value={r.id} />
            <div className="flex items-center justify-between">
              <Badge tone={r.active ? "green" : "neutral"}>{r.active ? "active" : "inactive"}</Badge>
            </div>
            <div>
              <Label>Départements concernés (séparés par des virgules)</Label>
              <Textarea name="departments" rows={2} defaultValue={r.departments} required />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label>Circonscription cible</Label><Input name="targetName" defaultValue={r.targetName} required /></div>
              <div><Label>Email de contact</Label><Input name="contactEmail" defaultValue={r.contactEmail} required /></div>
            </div>
            <div><Label>Message affiché à l'usager</Label><Textarea name="message" rows={3} defaultValue={r.message} required /></div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="active" defaultChecked={r.active} /> Active
              </label>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
          <form action={deleteRedirectRule.bind(null, r.id)} className="mt-2">
            <Button variant="danger" type="submit">Supprimer</Button>
          </form>
        </Card>
      ))}

      <Card>
        <h2 className="mb-3 font-semibold">Nouvelle règle</h2>
        <form action={saveRedirectRule} className="grid gap-3">
          <div><Label>Départements (CSV)</Label><Input name="departments" placeholder="01,03,04…" required /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Circonscription cible</Label><Input name="targetName" placeholder="Consulat Général à …" required /></div>
            <div><Label>Email de contact</Label><Input name="contactEmail" type="email" required /></div>
          </div>
          <div><Label>Message</Label><Textarea name="message" rows={2} required /></div>
          <input type="hidden" name="active" value="true" />
          <div><Button type="submit">Créer la règle</Button></div>
        </form>
      </Card>
    </div>
  );
}
