"use client";

import { useState } from "react";
import { setAppointmentStatus, addApplicantNote, setDocumentStatus, requestMoreInfo } from "@/lib/actions/staff";
import { Button, Input, Select, Textarea } from "@/components/ui";

export function AppointmentActions({ appointmentId, current }: { appointmentId: string; current: string }) {
  const [status, setStatus] = useState(current);
  return (
    <div className="flex items-center gap-2">
      <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto">
        {["SCHEDULED", "COMPLETED", "CANCELED", "NO_SHOW"].map((s) => <option key={s}>{s}</option>)}
      </Select>
      <Button variant="outline" onClick={() => setAppointmentStatus(appointmentId, status)}>Appliquer</Button>
    </div>
  );
}

export function NoteForm({ applicantId }: { applicantId: string }) {
  const [note, setNote] = useState("");
  return (
    <div className="space-y-2">
      <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Note interne…" />
      <Button
        variant="outline"
        onClick={async () => { if (note.trim()) { await addApplicantNote(applicantId, note.trim()); setNote(""); } }}
      >
        Ajouter la note
      </Button>
    </div>
  );
}

export function DocumentActions({ documentId, applicantId, current }: { documentId: string; applicantId: string; current: string }) {
  const [status, setStatus] = useState(current);
  return (
    <div className="flex items-center gap-1">
      <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto text-xs">
        {["RECEIVED", "VALIDATED", "REJECTED", "MORE_INFO"].map((s) => <option key={s}>{s}</option>)}
      </Select>
      <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => setDocumentStatus(documentId, status, applicantId)}>
        OK
      </Button>
    </div>
  );
}

export function MoreInfoForm({ applicantId }: { applicantId: string }) {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <div className="space-y-2">
      <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Pièce ou information manquante…" />
      <Button
        variant="outline"
        onClick={async () => {
          if (message.trim()) {
            await requestMoreInfo(applicantId, message.trim());
            setMessage("");
            setSent(true);
          }
        }}
      >
        Demander une pièce complémentaire
      </Button>
      {sent && <p className="text-xs text-green-700">Demande enregistrée (email automatique en production).</p>}
    </div>
  );
}
