"use client";

import { useActionState, useEffect, useState } from "react";
import { saveProfile } from "@/lib/actions/profile";
import { Button, Input, Label, Select } from "@/components/ui";

type Division = { id: string; name: string };

const COUNTRIES = [
  "Liban", "France", "Algérie", "Allemagne", "Belgique", "Brésil", "Canada", "Côte d'Ivoire",
  "Égypte", "Espagne", "États-Unis", "Italie", "Jordanie", "Maroc", "Royaume-Uni", "Sénégal",
  "Suisse", "Syrie", "Tunisie", "Autre",
];

type ProfileValues = {
  firstName: string;
  lastName: string;
  birthDate: string | null;
  phone: string | null;
  email: string;
  addressFrStreet: string | null;
  addressFrZip: string | null;
  addressFrCity: string | null;
  addressFrDept: string | null;
  mouhafazaId: string | null;
  kazaId: string | null;
  communeId: string | null;
  nationalities: { rank: number; country: string }[];
};

export function ProfileForm({ initial, saveLabel, savedLabel }: { initial: ProfileValues; saveLabel: string; savedLabel: string }) {
  const [state, formAction, pending] = useActionState(saveProfile, null);
  const [mouhafazas, setMouhafazas] = useState<Division[]>([]);
  const [kazas, setKazas] = useState<Division[]>([]);
  const [communes, setCommunes] = useState<Division[]>([]);
  const [mouhafazaId, setMouhafazaId] = useState(initial.mouhafazaId ?? "");
  const [kazaId, setKazaId] = useState(initial.kazaId ?? "");
  const [communeId, setCommuneId] = useState(initial.communeId ?? "");

  useEffect(() => {
    fetch("/api/divisions?level=1").then((r) => r.json()).then(setMouhafazas);
  }, []);

  useEffect(() => {
    if (!mouhafazaId) return setKazas([]);
    fetch(`/api/divisions?parentId=${mouhafazaId}`).then((r) => r.json()).then(setKazas);
  }, [mouhafazaId]);

  useEffect(() => {
    if (!kazaId) return setCommunes([]);
    fetch(`/api/divisions?parentId=${kazaId}`).then((r) => r.json()).then(setCommunes);
  }, [kazaId]);

  const nat = (rank: number) => initial.nationalities.find((n) => n.rank === rank)?.country ?? "";

  return (
    <form action={formAction} className="space-y-8">
      <section className="rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="mb-4 font-semibold">Informations Générales</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="firstName">Prénom *</Label>
            <Input id="firstName" name="firstName" required defaultValue={initial.firstName} />
          </div>
          <div>
            <Label htmlFor="lastName">Nom de famille *</Label>
            <Input id="lastName" name="lastName" required defaultValue={initial.lastName} />
          </div>
          <div>
            <Label htmlFor="birthDate">Date de naissance *</Label>
            <Input id="birthDate" name="birthDate" type="date" defaultValue={initial.birthDate ?? ""} />
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input id="email" value={initial.email} disabled />
          </div>
          <div>
            <Label htmlFor="phone">Téléphone Portable *</Label>
            <Input id="phone" name="phone" type="tel" defaultValue={initial.phone ?? ""} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="mb-4 font-semibold">Nationalité (jusqu'à 3)</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((rank) => (
            <div key={rank}>
              <Label htmlFor={`nationality${rank}`}>
                {rank === 1 ? "1ère Nationalité *" : `${rank}ème Nationalité`}
              </Label>
              <Select id={`nationality${rank}`} name={`nationality${rank}`} defaultValue={nat(rank)}>
                <option value="">—</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
              <p className="mt-1 text-xs text-stone-400">
                Pièce jointe : module « Attachez vos documents » (max 500 Mo)
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="mb-4 font-semibold">Adresse France</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="addressFrZip">Code postal</Label>
            <Input id="addressFrZip" name="addressFrZip" defaultValue={initial.addressFrZip ?? ""} />
          </div>
          <div>
            <Label htmlFor="addressFrCity">Commune</Label>
            <Input id="addressFrCity" name="addressFrCity" defaultValue={initial.addressFrCity ?? ""} />
          </div>
          <div>
            <Label htmlFor="addressFrDept">Département</Label>
            <Input id="addressFrDept" name="addressFrDept" defaultValue={initial.addressFrDept ?? ""} />
          </div>
          <div className="sm:col-span-3">
            <Label htmlFor="addressFrStreet">Adresse *</Label>
            <Input id="addressFrStreet" name="addressFrStreet" defaultValue={initial.addressFrStreet ?? ""} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="mb-4 font-semibold">Adresse Liban</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Mouhafaza</Label>
            <Select
              name="mouhafazaId"
              value={mouhafazaId}
              onChange={(e) => { setMouhafazaId(e.target.value); setKazaId(""); setCommuneId(""); }}
            >
              <option value="">—</option>
              {mouhafazas.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </Select>
          </div>
          <div>
            <Label>Kaza</Label>
            <Select
              name="kazaId"
              value={kazaId}
              onChange={(e) => { setKazaId(e.target.value); setCommuneId(""); }}
              disabled={!mouhafazaId}
            >
              <option value="">—</option>
              {kazas.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
            </Select>
          </div>
          <div>
            <Label>Baldé / Commune</Label>
            <Select name="communeId" value={communeId} onChange={(e) => setCommuneId(e.target.value)} disabled={!kazaId}>
              <option value="">—</option>
              {communes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <p className="mt-1 text-xs text-stone-400">
              Liste complète des communes importable depuis la console d'administration (CSV).
            </p>
          </div>
        </div>
      </section>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{savedLabel}</p>}

      <Button type="submit" disabled={pending} className="px-8">
        {saveLabel}
      </Button>
    </form>
  );
}
