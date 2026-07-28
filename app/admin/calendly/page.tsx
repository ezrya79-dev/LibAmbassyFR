import { requireAdmin } from "@/lib/auth";
import { saveCalendlySettings, disconnectCalendly } from "@/lib/actions/admin";
import { db } from "@/lib/db";
import { AdminNav } from "@/components/admin-nav";
import { Button, Card, Input, Label, Badge } from "@/components/ui";
import { CheckCircle2, XCircle } from "lucide-react";

export default async function AdminCalendlyPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  await requireAdmin();
  const { connected, error } = await searchParams;
  const connection = await db.calendlyConnection.findUnique({ where: { singleton: "main" } });
  const formalities = await db.formality.findMany({
    orderBy: [{ service: { order: "asc" } }, { order: "asc" }],
    include: { service: true },
  });
  const oauthConfigured = Boolean(process.env.CALENDLY_CLIENT_ID && process.env.CALENDLY_CLIENT_SECRET);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Intégration Calendly</h1>
      <AdminNav current="/admin/calendly" />

      {connected && <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">Compte Calendly connecté ✔</p>}
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">Erreur de connexion : {error}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">Connexion API v2 (OAuth2)</h2>
          <div className="mb-4 flex items-center gap-2 text-sm">
            {connection?.accessToken ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span>Connecté {connection.connectedAt && `le ${connection.connectedAt.toLocaleDateString("fr-FR")}`}</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-stone-400" />
                <span>Non connecté</span>
              </>
            )}
          </div>
          {connection?.organizationUri && (
            <p className="mb-3 break-all text-xs text-stone-500">Organisation : {connection.organizationUri}</p>
          )}
          {oauthConfigured ? (
            <div className="flex gap-2">
              <a href="/api/calendly/oauth/start"><Button>Connecter le compte Calendly</Button></a>
              {connection?.accessToken && (
                <form action={disconnectCalendly}><Button variant="outline" type="submit">Déconnecter</Button></form>
              )}
            </div>
          ) : (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              Renseignez <code>CALENDLY_CLIENT_ID</code> et <code>CALENDLY_CLIENT_SECRET</code> dans <code>.env</code> pour
              activer la connexion OAuth2 (à créer sur developer.calendly.com).
            </p>
          )}

          <form action={saveCalendlySettings} className="mt-6 grid gap-3">
            <div>
              <Label>Clé de signature du webhook</Label>
              <Input
                name="webhookSigningKey"
                defaultValue={connection?.webhookSigningKey ?? ""}
                placeholder="Fournie lors de la création du webhook Calendly"
              />
            </div>
            <p className="text-xs text-stone-500">
              URL du webhook à déclarer chez Calendly :{" "}
              <code className="break-all">{process.env.APP_URL}/api/webhooks/calendly</code> — événements{" "}
              <code>invitee.created</code> et <code>invitee.canceled</code>.
            </p>
            <div><Button type="submit" variant="outline">Enregistrer la clé</Button></div>
          </form>
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold">Mapping Event Type par formalité</h2>
          <p className="mb-3 text-xs text-stone-500">
            Le lien de réservation (embed iframe) et l'Event Type URI se modifient par formalité dans{" "}
            <a href="/admin/services" className="underline">Services & Formalités</a>.
          </p>
          <ul className="max-h-96 space-y-2 overflow-y-auto text-sm">
            {formalities.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-2 border-b border-stone-100 pb-1">
                <span>
                  <span className="text-stone-400">{f.service.name} —</span> {f.name}
                </span>
                <span className="flex gap-1">
                  {f.calendlyUrl ? <Badge tone="blue">lien</Badge> : <Badge>pas de lien</Badge>}
                  {f.calendlyEventTypeUri && <Badge tone="green">API</Badge>}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
