"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, Info } from "lucide-react";
import { bookAppointment } from "@/lib/actions/booking";
import { SlotPicker, type PickedSlot } from "@/components/slot-picker";
import { Button, Input, Label } from "@/components/ui";

type Labels = {
  chooseSlot: string;
  noSlots: string;
  prevPeriod: string;
  nextPeriod: string;
  yourDetails: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  confirmBooking: string;
  bookingNotDoneYet: string;
  selectedSlot: string;
  changeSlot: string;
  remainingPlaces: string;
};

// Parcours de réservation en 2 temps sur la même page : créneau → coordonnées.
// La réservation n'existe qu'après « Confirmer » — et l'usager en est averti,
// contrairement à l'ancien embed Calendly où ce moment était ambigu.
export function BookingWidget({
  formalityId,
  serviceId,
  prefill,
  labels,
}: {
  formalityId: string;
  serviceId: string;
  prefill?: { firstName?: string; lastName?: string; email?: string; phone?: string };
  labels: Labels;
}) {
  const router = useRouter();
  const [slot, setSlot] = useState<PickedSlot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    if (!slot) return;
    setError(null);
    formData.set("formalityId", formalityId);
    formData.set("startISO", slot.startISO);
    startTransition(async () => {
      const result = await bookAppointment(formData);
      if (result.ok) {
        router.push(`/rdv/confirmation/${result.reference}?t=${result.token}`);
      } else {
        setError(result.error);
        // Le créneau a pu être pris entre-temps : on force un nouveau choix
        // (le message d'erreur reste visible au-dessus du calendrier).
        if (result.error.toLowerCase().includes("créneau")) setSlot(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{labels.bookingNotDoneYet}</p>
      </div>

      {/* Affiché ici (et non dans le formulaire) : si le créneau vient d'être
          pris, l'usager est renvoyé au calendrier et doit voir pourquoi. */}
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>
      )}

      {!slot ? (
        <>
          <h3 className="font-semibold">{labels.chooseSlot}</h3>
          <SlotPicker
            serviceId={serviceId}
            selected={null}
            onSelect={setSlot}
            labels={{
              noSlots: labels.noSlots,
              prevPeriod: labels.prevPeriod,
              nextPeriod: labels.nextPeriod,
              remainingPlaces: labels.remainingPlaces,
            }}
          />
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--brand)] bg-[var(--brand-light)] p-4">
            <div className="flex items-center gap-3">
              <CalendarCheck className="h-6 w-6 text-[var(--brand)]" />
              <div>
                <div className="text-xs uppercase text-stone-500">{labels.selectedSlot}</div>
                <div className="font-semibold capitalize">
                  {slot.dayLabel} · {slot.timeLabel}
                </div>
              </div>
            </div>
            <Button variant="outline" type="button" onClick={() => setSlot(null)}>
              {labels.changeSlot}
            </Button>
          </div>

          <form action={submit} className="rounded-xl border border-stone-200 bg-white p-5">
            <h3 className="mb-4 font-semibold">{labels.yourDetails}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="firstName">{labels.firstName}</Label>
                <Input id="firstName" name="firstName" required defaultValue={prefill?.firstName ?? ""} />
              </div>
              <div>
                <Label htmlFor="lastName">{labels.lastName}</Label>
                <Input id="lastName" name="lastName" required defaultValue={prefill?.lastName ?? ""} />
              </div>
              <div>
                <Label htmlFor="email">{labels.email}</Label>
                <Input id="email" name="email" type="email" required defaultValue={prefill?.email ?? ""} />
              </div>
              <div>
                <Label htmlFor="phone">{labels.phone}</Label>
                <Input id="phone" name="phone" type="tel" defaultValue={prefill?.phone ?? ""} />
              </div>
            </div>
            <Button type="submit" disabled={pending} className="mt-5 w-full sm:w-auto">
              {pending ? "…" : labels.confirmBooking}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
