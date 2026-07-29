import { requireAdmin } from "@/lib/auth";
import {
  saveService, deleteService, saveFormality, deleteFormality,
  addRequiredDocument, deleteRequiredDocument,
} from "@/lib/actions/admin";
import { db } from "@/lib/db";
import { AdminNav } from "@/components/admin-nav";
import { Button, Card, Input, Label, Select, Textarea, Badge } from "@/components/ui";

export default async function AdminServicesPage() {
  await requireAdmin();
  const services = await db.service.findMany({
    orderBy: { order: "asc" },
    include: { formalities: { orderBy: { order: "asc" }, include: { requiredDocuments: { orderBy: { order: "asc" } } } } },
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Services & Formalités</h1>
      <AdminNav current="/admin/services" />

      {/* Nouveau service */}
      <Card className="mb-6">
        <h2 className="mb-3 font-semibold">Nouveau service</h2>
        <form action={saveService} className="grid gap-3 sm:grid-cols-4">
          <Input name="name" placeholder="Nom du service" required />
          <Input name="icon" placeholder="Icône (book, stamp…)" />
          <Input name="order" type="number" placeholder="Ordre" defaultValue={services.length + 1} />
          <input type="hidden" name="active" value="true" />
          <Button type="submit">Créer</Button>
        </form>
      </Card>

      {services.map((s) => (
        <Card key={s.id} className="mb-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">
              {s.name} <Badge tone={s.active ? "green" : "neutral"}>{s.active ? "actif" : "inactif"}</Badge>
            </h2>
            <form action={deleteService.bind(null, s.id)}>
              <Button variant="danger" type="submit" className="px-3 py-1 text-xs">Supprimer le service</Button>
            </form>
          </div>

          {/* Édition du service */}
          <details className="mb-4">
            <summary className="cursor-pointer text-sm font-medium text-[var(--brand)]">Paramètres du service</summary>
            <form action={saveService} className="mt-3 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={s.id} />
              <div><Label>Nom</Label><Input name="name" defaultValue={s.name} required /></div>
              <div><Label>Slug</Label><Input name="slug" defaultValue={s.slug} /></div>
              <div><Label>Icône</Label><Input name="icon" defaultValue={s.icon ?? ""} /></div>
              <div><Label>Ordre</Label><Input name="order" type="number" defaultValue={s.order} /></div>
              <div><Label>Email de contact</Label><Input name="contactEmail" defaultValue={s.contactEmail ?? ""} /></div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="active" defaultChecked={s.active} /> Actif
                </label>
              </div>
              <div className="sm:col-span-2">
                <Label>Bandeau affiché sur la page du service</Label>
                <Textarea name="banner" rows={4} defaultValue={s.banner ?? ""} />
              </div>
              <div className="sm:col-span-2">
                <Label>Formulaire téléchargeable (URL du PDF, ex. /formulaires/formulaire-visa.pdf)</Label>
                <Input name="formUrl" defaultValue={s.formUrl ?? ""} placeholder="/formulaires/…pdf" />
              </div>
              <div><Button type="submit">Enregistrer</Button></div>
            </form>
          </details>

          {/* Formalités */}
          <div className="space-y-3">
            {s.formalities.map((f) => (
              <div key={f.id} className="rounded-lg border border-stone-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium">
                    {f.order}. {f.name}{" "}
                    {!f.active && <Badge>inactif</Badge>}
                    {f.calendlyUrl && <Badge tone="blue">Calendly</Badge>}
                  </div>
                  <form action={deleteFormality.bind(null, f.id)}>
                    <Button variant="ghost" type="submit" className="px-2 py-1 text-xs text-red-600">Supprimer</Button>
                  </form>
                </div>

                {/* Documents requis */}
                {f.requiredDocuments.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm text-stone-600">
                    {f.requiredDocuments.map((d) => (
                      <li key={d.id} className="flex items-center justify-between gap-2">
                        <span>• {d.label}{!d.required && " (optionnel)"}</span>
                        <form action={deleteRequiredDocument.bind(null, d.id)}>
                          <button className="text-xs text-red-500 hover:underline">retirer</button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}
                <form action={addRequiredDocument} className="mt-2 flex gap-2">
                  <input type="hidden" name="formalityId" value={f.id} />
                  <Input name="label" placeholder="Ajouter une pièce requise…" className="text-sm" />
                  <Button variant="outline" type="submit" className="shrink-0 px-3 py-1 text-xs">+ Pièce</Button>
                </form>

                {/* Édition formalité */}
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-medium text-[var(--brand)]">Modifier la formalité</summary>
                  <form action={saveFormality} className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input type="hidden" name="id" value={f.id} />
                    <input type="hidden" name="serviceId" value={s.id} />
                    <div className="sm:col-span-2"><Label>Nom</Label><Input name="name" defaultValue={f.name} required /></div>
                    <div className="sm:col-span-2"><Label>Description</Label><Textarea name="description" rows={2} defaultValue={f.description ?? ""} /></div>
                    <div className="sm:col-span-2"><Label>Contenu (procédure, notes)</Label><Textarea name="content" rows={3} defaultValue={f.content ?? ""} /></div>
                    <div><Label>Taxe (montant €)</Label><Input name="taxAmount" type="number" step="0.01" defaultValue={f.taxAmount ?? ""} /></div>
                    <div><Label>Mode de paiement</Label><Input name="taxMode" defaultValue={f.taxMode ?? ""} placeholder="espèces / virement…" /></div>
                    <div className="sm:col-span-2"><Label>Détail taxe</Label><Input name="taxDetail" defaultValue={f.taxDetail ?? ""} /></div>
                    <div><Label>Email de contact</Label><Input name="emailContact" defaultValue={f.emailContact ?? ""} /></div>
                    <div><Label>Ordre</Label><Input name="order" type="number" defaultValue={f.order} /></div>
                    <div><Label>Calendly — lien de réservation</Label><Input name="calendlyUrl" defaultValue={f.calendlyUrl ?? ""} placeholder="https://calendly.com/…" /></div>
                    <div><Label>Calendly — Event Type URI (API v2)</Label><Input name="calendlyEventTypeUri" defaultValue={f.calendlyEventTypeUri ?? ""} placeholder="https://api.calendly.com/event_types/…" /></div>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="active" defaultChecked={f.active} /> Actif
                    </label>
                    <div><Button type="submit">Enregistrer</Button></div>
                  </form>
                </details>
              </div>
            ))}
          </div>

          {/* Nouvelle formalité */}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-[var(--brand)]">+ Nouvelle formalité dans « {s.name} »</summary>
            <form action={saveFormality} className="mt-3 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="serviceId" value={s.id} />
              <input type="hidden" name="active" value="true" />
              <div className="sm:col-span-2"><Label>Nom</Label><Input name="name" required /></div>
              <div><Label>Ordre</Label><Input name="order" type="number" defaultValue={s.formalities.length + 1} /></div>
              <div><Label>Email de contact</Label><Input name="emailContact" defaultValue={s.contactEmail ?? ""} /></div>
              <div className="sm:col-span-2"><Label>Calendly — lien de réservation</Label><Input name="calendlyUrl" placeholder="https://calendly.com/…" /></div>
              <div><Button type="submit">Créer la formalité</Button></div>
            </form>
          </details>
        </Card>
      ))}
    </div>
  );
}
