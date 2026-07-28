import { requireAdmin } from "@/lib/auth";
import { saveUser, deleteUser } from "@/lib/actions/admin";
import { db } from "@/lib/db";
import { AdminNav } from "@/components/admin-nav";
import { Button, Card, Input, Label, Select, Badge } from "@/components/ui";

const ROLE_TONE: Record<string, "neutral" | "green" | "red" | "amber" | "blue"> = {
  ADMIN: "red", SUPERVISOR: "amber", AGENT: "blue",
};

export default async function AdminUsersPage() {
  const current = await requireAdmin();
  const [users, services] = await Promise.all([
    db.user.findMany({ orderBy: { createdAt: "asc" } }),
    db.service.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Comptes employés & rôles (RBAC)</h1>
      <AdminNav current="/admin/utilisateurs" />

      <div className="space-y-4">
        {users.map((u) => {
          const scoped: string[] = JSON.parse(u.serviceIds || "[]");
          return (
            <Card key={u.id}>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="font-semibold">{u.name}</span>
                <Badge tone={ROLE_TONE[u.role] ?? "neutral"}>{u.role}</Badge>
                <span className="text-sm text-stone-500">{u.email}</span>
                {u.mfaEnabled && <Badge tone="green">MFA</Badge>}
              </div>
              <details>
                <summary className="cursor-pointer text-sm font-medium text-[var(--brand)]">Modifier</summary>
                <form action={saveUser} className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input type="hidden" name="id" value={u.id} />
                  <div><Label>Nom</Label><Input name="name" defaultValue={u.name} required /></div>
                  <div><Label>Email</Label><Input name="email" type="email" defaultValue={u.email} required /></div>
                  <div>
                    <Label>Rôle</Label>
                    <Select name="role" defaultValue={u.role}>
                      <option value="AGENT">AGENT</option>
                      <option value="SUPERVISOR">SUPERVISOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </Select>
                  </div>
                  <div><Label>Nouveau mot de passe (vide = inchangé)</Label><Input name="password" type="password" /></div>
                  <div className="sm:col-span-2">
                    <Label>Scoping par service (agents)</Label>
                    <div className="flex flex-wrap gap-3">
                      {services.map((s) => (
                        <label key={s.id} className="flex items-center gap-1.5 text-sm">
                          <input type="checkbox" name="serviceIds" value={s.id} defaultChecked={scoped.includes(s.id)} />
                          {s.name}
                        </label>
                      ))}
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="mfaEnabled" defaultChecked={u.mfaEnabled} /> MFA obligatoire
                  </label>
                  <div className="flex gap-2">
                    <Button type="submit">Enregistrer</Button>
                  </div>
                </form>
                {u.id !== current.id && (
                  <form action={deleteUser.bind(null, u.id)} className="mt-2">
                    <Button variant="danger" type="submit" className="px-3 py-1 text-xs">Supprimer le compte</Button>
                  </form>
                )}
              </details>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <h2 className="mb-3 font-semibold">Nouveau compte</h2>
        <form action={saveUser} className="grid gap-3 sm:grid-cols-2">
          <div><Label>Nom</Label><Input name="name" required /></div>
          <div><Label>Email</Label><Input name="email" type="email" required /></div>
          <div>
            <Label>Rôle</Label>
            <Select name="role" defaultValue="AGENT">
              <option value="AGENT">AGENT</option>
              <option value="SUPERVISOR">SUPERVISOR</option>
              <option value="ADMIN">ADMIN</option>
            </Select>
          </div>
          <div><Label>Mot de passe</Label><Input name="password" type="password" required /></div>
          <div className="sm:col-span-2">
            <Label>Scoping par service</Label>
            <div className="flex flex-wrap gap-3">
              {services.map((s) => (
                <label key={s.id} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" name="serviceIds" value={s.id} /> {s.name}
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="mfaEnabled" /> MFA obligatoire
          </label>
          <div><Button type="submit">Créer le compte</Button></div>
        </form>
      </Card>
    </div>
  );
}
