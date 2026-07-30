"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";

export type PickedSlot = { startISO: string; dayLabel: string; timeLabel: string };

type SlotDto = { startISO: string; endISO: string; label: string; remaining: number };
type DayDto = { date: string; label: string; slots: SlotDto[] };
type SlotsResponse = { days: DayDto[]; prevFrom: string | null; nextFrom: string | null };

// Calendrier de créneaux natif (remplace l'iframe Calendly) : navigation par
// période, choix d'un créneau, entièrement dans la charte du portail.
export function SlotPicker({
  serviceId,
  selected,
  onSelect,
  labels,
}: {
  serviceId: string;
  selected: string | null;
  onSelect: (slot: PickedSlot) => void;
  labels: { noSlots: string; prevPeriod: string; nextPeriod: string; remainingPlaces: string };
}) {
  const [data, setData] = useState<SlotsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(
    async (from?: string | null) => {
      setLoading(true);
      setError(false);
      try {
        const qs = new URLSearchParams({ serviceId });
        if (from) qs.set("from", from);
        const res = await fetch(`/api/rdv/slots?${qs}`);
        if (!res.ok) throw new Error();
        setData(await res.json());
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    [serviceId]
  );

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-400">
        Chargement des disponibilités…
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-800">
        Impossible de charger les disponibilités.{" "}
        <button className="font-medium underline" onClick={() => load()}>
          Réessayer
        </button>
      </div>
    );
  }

  const daysWithSlots = data.days.filter((d) => d.slots.length > 0);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      {daysWithSlots.length === 0 ? (
        <p className="py-6 text-center text-sm text-stone-500">{labels.noSlots}</p>
      ) : (
        <div className="space-y-5">
          {daysWithSlots.map((day) => (
            <div key={day.date}>
              <div className="mb-2 text-sm font-semibold capitalize text-stone-700">{day.label}</div>
              {/* Grille sur mobile (créneaux alignés, pleine largeur tactile),
                  retour au flux libre dès `sm`. */}
              <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
                {day.slots.map((slot) => {
                  const isSelected = selected === slot.startISO;
                  return (
                    <button
                      key={slot.startISO}
                      type="button"
                      onClick={() =>
                        onSelect({ startISO: slot.startISO, dayLabel: day.label, timeLabel: slot.label })
                      }
                      className={`min-h-11 rounded-lg border px-3 text-sm font-medium transition-colors ${
                        isSelected
                          ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                          : "border-stone-300 bg-white hover:border-[var(--brand)] hover:text-[var(--brand)]"
                      }`}
                      title={slot.remaining > 1 ? `${slot.remaining} ${labels.remainingPlaces}` : undefined}
                    >
                      {slot.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4">
        <Button variant="outline" disabled={!data.prevFrom} onClick={() => load(data.prevFrom)}>
          {labels.prevPeriod}
        </Button>
        <Button variant="outline" disabled={!data.nextFrom} onClick={() => load(data.nextFrom)}>
          {labels.nextPeriod}
        </Button>
      </div>
    </div>
  );
}
