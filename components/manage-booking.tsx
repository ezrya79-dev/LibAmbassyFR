"use client";

import { useEffect, useState, useTransition } from "react";
import { CalendarDays, CheckCircle2, XCircle } from "lucide-react";
import {
  cancelAppointment,
  lookupAppointment,
  rescheduleAppointment,
  type ManagedAppointment,
} from "@/lib/actions/booking";
import { SlotPicker, type PickedSlot } from "@/components/slot-picker";
import { Button, Card, Input, Label } from "@/components/ui";

type Labels = {
  findBooking: string;
  reference: string;
  email: string;
  cancelBooking: string;
  moveBooking: string;
  bookingCanceled: string;
  bookingMoved: string;
  noSlots: string;
  prevPeriod: string;
  nextPeriod: string;
  remainingPlaces: string;
  dateTime: string;
  changeSlot: string;
};

const dtFmt = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

// Gestion d'un RDV sans compte : référence + email, ou lien direct (ref + jeton).
export function ManageBooking({
  initialRef,
  initialToken,
  labels,
}: {
  initialRef?: string;
  initialToken?: string;
  labels: Labels;
}) {
  const [refInput, setRefInput] = useState(initialRef ?? "");
  const [emailInput, setEmailInput] = useState("");
  const [appt, setAppt] = useState<ManagedAppointment | null>(null);
  const [mode, setMode] = useState<"view" | "reschedule">("view");
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [pending, startTransition] = useTransition();

  // Arrivée par lien direct (confirmation / espace usager) : chargement immédiat.
  useEffect(() => {
    if (initialRef && initialToken) {
      startTransition(async () => {
        const res = await lookupAppointment(initialRef, { token: initialToken });
        if (res.ok) setAppt(res.appointment);
        else setNotice({ kind: "err", msg: res.error });
      });
    }
  }, [initialRef, initialToken]);

  function find(formData: FormData) {
    setNotice(null);
    startTransition(async () => {
      const res = await lookupAppointment(String(formData.get("ref") ?? ""), {
        email: String(formData.get("email") ?? ""),
      });
      if (res.ok) setAppt(res.appointment);
      else setNotice({ kind: "err", msg: res.error });
    });
  }

  function cancel() {
    if (!appt) return;
    if (!window.confirm("Confirmer l'annulation de ce rendez-vous ?")) return;
    setNotice(null);
    startTransition(async () => {
      const res = await cancelAppointment(appt.reference, appt.token);
      if (res.ok) {
        setAppt({ ...appt, status: "CANCELED" });
        setNotice({ kind: "ok", msg: labels.bookingCanceled });
      } else {
        setNotice({ kind: "err", msg: res.error ?? "Erreur." });
      }
    });
  }

  function move(slot: PickedSlot) {
    if (!appt) return;
    setNotice(null);
    startTransition(async () => {
      const res = await rescheduleAppointment(appt.reference, appt.token, slot.startISO);
      if (res.ok) {
        setAppt({ ...appt, startISO: slot.startISO });
        setMode("view");
        setNotice({ kind: "ok", msg: labels.bookingMoved });
      } else {
        setNotice({ kind: "err", msg: res.error ?? "Erreur." });
      }
    });
  }

  return (
    <div className="space-y-4">
      {!appt && (
        <Card>
          <form action={find} className="space-y-4">
            <div>
              <Label htmlFor="ref">{labels.reference}</Label>
              <Input
                id="ref"
                name="ref"
                placeholder="LB-XXXXXX"
                required
                value={refInput}
                onChange={(e) => setRefInput(e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <Label htmlFor="email">{labels.email}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "…" : labels.findBooking}
            </Button>
          </form>
        </Card>
      )}

      {appt && (
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase text-stone-500">{labels.reference}</div>
              <div className="text-lg font-bold tracking-wider text-[var(--brand)]">{appt.reference}</div>
              <div className="mt-1 text-sm text-stone-600">
                {appt.serviceName} · {appt.formalityName}
              </div>
            </div>
            {appt.status === "SCHEDULED" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                <CheckCircle2 className="h-3.5 w-3.5" /> Confirmé
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">
                <XCircle className="h-3.5 w-3.5" /> {appt.status === "CANCELED" ? "Annulé" : appt.status}
              </span>
            )}
          </div>

          {appt.startISO && (
            <div className="mt-4 flex items-center gap-2 text-sm text-stone-700">
              <CalendarDays className="h-4 w-4 text-[var(--brand)]" />
              <span className="capitalize">{dtFmt.format(new Date(appt.startISO))}</span>
            </div>
          )}

          {appt.status === "SCHEDULED" && mode === "view" && (
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="outline" type="button" onClick={() => setMode("reschedule")}>
                {labels.moveBooking}
              </Button>
              <Button variant="danger" type="button" onClick={cancel} disabled={pending}>
                {labels.cancelBooking}
              </Button>
            </div>
          )}
        </Card>
      )}

      {appt && appt.status === "SCHEDULED" && mode === "reschedule" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{labels.moveBooking}</h3>
            <Button variant="ghost" type="button" onClick={() => setMode("view")}>
              ✕
            </Button>
          </div>
          <SlotPicker
            serviceId={appt.serviceId}
            selected={null}
            onSelect={move}
            labels={{
              noSlots: labels.noSlots,
              prevPeriod: labels.prevPeriod,
              nextPeriod: labels.nextPeriod,
              remainingPlaces: labels.remainingPlaces,
            }}
          />
        </div>
      )}

      {notice && (
        <p
          className={`rounded-lg border p-3 text-sm ${
            notice.kind === "ok"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {notice.msg}
        </p>
      )}
    </div>
  );
}
