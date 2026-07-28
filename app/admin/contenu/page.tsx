import { requireAdmin } from "@/lib/auth";
import { saveContentBlock, saveEntity } from "@/lib/actions/admin";
import { db } from "@/lib/db";
import { AdminNav } from "@/components/admin-nav";
import { Button, Card, Input, Label, Textarea } from "@/components/ui";

export default async function AdminContenuPage() {
  await requireAdmin();
  const [entity, blocks] = await Promise.all([
    db.entity.findFirstOrThrow(),
    db.contentBlock.findMany({ orderBy: { key: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Contenu & personnalisation de marque</h1>
      <AdminNav current="/admin/contenu" />

      <Card className="mb-6">
        <h2 className="mb-3 font-semibold">Identité de l'entité</h2>
        <form action={saveEntity} className="grid gap-3 sm:grid-cols-2">
          <div><Label>Nom</Label><Input name="name" defaultValue={entity.name} required /></div>
          <div><Label>Tagline</Label><Input name="tagline" defaultValue={entity.tagline ?? ""} /></div>
          <div>
            <Label>Couleur principale</Label>
            <div className="flex items-center gap-2">
              <input type="color" name="primaryColor" defaultValue={entity.primaryColor} className="h-9 w-14 cursor-pointer rounded border" />
              <span className="text-sm text-stone-500">{entity.primaryColor}</span>
            </div>
          </div>
          <div><Label>Téléphone</Label><Input name="phone" defaultValue={entity.phone} required /></div>
          <div><Label>Email</Label><Input name="email" type="email" defaultValue={entity.email} required /></div>
          <div><Label>Horaires d'ouverture</Label><Input name="openingHours" defaultValue={entity.openingHours} required /></div>
          <div className="sm:col-span-2"><Label>Adresse</Label><Input name="address" defaultValue={entity.address} required /></div>
          <div><Button type="submit">Enregistrer</Button></div>
        </form>
      </Card>

      <div className="space-y-4">
        {blocks.map((b) => (
          <Card key={b.id}>
            <div className="mb-2 text-xs font-mono text-stone-400">{b.key} · {b.locale}</div>
            <form action={saveContentBlock} className="grid gap-3">
              <input type="hidden" name="key" value={b.key} />
              <input type="hidden" name="locale" value={b.locale} />
              <div><Label>Titre</Label><Input name="title" defaultValue={b.title ?? ""} /></div>
              <div><Label>Contenu</Label><Textarea name="body" rows={b.body.length > 300 ? 8 : 3} defaultValue={b.body} /></div>
              <div><Button type="submit">Enregistrer</Button></div>
            </form>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <h2 className="mb-3 font-semibold">Nouveau bloc de contenu</h2>
        <form action={saveContentBlock} className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Clé</Label><Input name="key" placeholder="home.tile.rdv" required /></div>
            <div><Label>Locale</Label><Input name="locale" defaultValue="fr" required /></div>
          </div>
          <div><Label>Titre</Label><Input name="title" /></div>
          <div><Label>Contenu</Label><Textarea name="body" rows={3} required /></div>
          <div><Button type="submit">Créer</Button></div>
        </form>
      </Card>
    </div>
  );
}
