"use client";

import { useRef, useState } from "react";
import { Button, Label, Select } from "@/components/ui";

type FormalityOption = { id: string; name: string; serviceName: string };

export function UploadForm({
  formalities,
  maxMb,
  uploadLabel,
}: {
  formalities: FormalityOption[];
  maxMb: number;
  uploadLabel: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [formalityId, setFormalityId] = useState("");
  const [status, setStatus] = useState<{ kind: "ok" | "err" | "busy"; msg: string } | null>(null);

  async function submit() {
    const file = fileRef.current?.files?.[0];
    if (!file) return setStatus({ kind: "err", msg: "Sélectionnez un fichier." });
    setStatus({ kind: "busy", msg: "Envoi en cours…" });
    const fd = new FormData();
    fd.append("file", file);
    if (formalityId) fd.append("formalityId", formalityId);
    const res = await fetch("/api/documents", { method: "POST", body: fd });
    if (res.ok) {
      setStatus({ kind: "ok", msg: "Document envoyé ✔" });
      if (fileRef.current) fileRef.current.value = "";
      window.location.reload();
    } else {
      const data = await res.json().catch(() => ({}));
      setStatus({ kind: "err", msg: data.error ?? "Échec de l'envoi." });
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Formalité concernée (optionnel)</Label>
        <Select value={formalityId} onChange={(e) => setFormalityId(e.target.value)}>
          <option value="">— Document général du dossier —</option>
          {formalities.map((f) => (
            <option key={f.id} value={f.id}>
              {f.serviceName} — {f.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Fichier (max {maxMb} Mo)</Label>
        <input
          ref={fileRef}
          type="file"
          className="block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--brand-light)] file:px-4 file:py-2 file:text-sm file:font-medium file:text-[var(--brand)] hover:file:bg-green-100"
        />
      </div>
      {status && (
        <p className={`text-sm ${status.kind === "err" ? "text-red-600" : status.kind === "ok" ? "text-green-700" : "text-stone-500"}`}>
          {status.msg}
        </p>
      )}
      <Button onClick={submit} disabled={status?.kind === "busy"}>
        {uploadLabel}
      </Button>
    </div>
  );
}
