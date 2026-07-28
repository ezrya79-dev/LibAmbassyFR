import crypto from "crypto";
import { db } from "./db";

// Moteur de créneaux natif. Les règles de disponibilité sont exprimées en
// heure de Paris ; les instants sont stockés en UTC. Toute la conversion se
// fait ici, indépendamment du fuseau du serveur.

export const BOOKING_TZ = "Europe/Paris";
// Fenêtre de réservation : pas de créneau dans moins de 2 h ni au-delà de 60 jours.
export const MIN_NOTICE_MS = 2 * 3600 * 1000;
export const MAX_DAYS_AHEAD = 60;
// Nombre de jours renvoyés par page de calendrier côté usager.
export const CALENDAR_PAGE_DAYS = 14;

// ---------------------------------------------------------------- fuseau

function tzOffsetMinutes(instant: Date): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: BOOKING_TZ,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(instant)
      .map((p) => [p.type, p.value])
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second)
  );
  return Math.round((asUtc - instant.getTime()) / 60000);
}

// Convertit une heure murale de Paris (date civile + minutes depuis minuit)
// en instant UTC. Double passe pour être exact autour des changements d'heure.
export function parisWallTimeToUtc(dateISO: string, minuteOfDay: number): Date {
  const [y, m, d] = dateISO.split("-").map(Number);
  let guess = new Date(Date.UTC(y, m - 1, d, 0, minuteOfDay));
  for (let i = 0; i < 2; i++) {
    guess = new Date(Date.UTC(y, m - 1, d, 0, minuteOfDay - tzOffsetMinutes(guess)));
  }
  return guess;
}

// Minutes écoulées depuis minuit à Paris pour un instant donné.
export function parisMinuteOfDay(instant: Date): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: BOOKING_TZ,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(instant)
      .map((p) => [p.type, p.value])
  );
  return (Number(parts.hour) % 24) * 60 + Number(parts.minute);
}

// Date civile ("YYYY-MM-DD") d'un instant, vue de Paris.
export function parisDateOf(instant: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BOOKING_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

// 1 = lundi … 7 = dimanche, pour une date civile (indépendant du fuseau).
export function isoWeekday(dateISO: string): number {
  const [y, m, d] = dateISO.split("-").map(Number);
  return ((new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7) + 1;
}

export function addDays(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

// ---------------------------------------------------------------- créneaux

export type Slot = { startISO: string; endISO: string; label: string; remaining: number };
export type DaySlots = { date: string; label: string; slots: Slot[] };

const timeFmt = new Intl.DateTimeFormat("fr-FR", {
  timeZone: BOOKING_TZ,
  hour: "2-digit",
  minute: "2-digit",
});
const dayFmt = new Intl.DateTimeFormat("fr-FR", {
  timeZone: BOOKING_TZ,
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function bookingWindow(now = new Date()) {
  const from = parisDateOf(new Date(now.getTime() + MIN_NOTICE_MS));
  const to = addDays(parisDateOf(now), MAX_DAYS_AHEAD);
  return { from, to };
}

// Créneaux disponibles d'un service entre deux dates civiles (incluses).
// `remaining` = capacité restante (capacité de la règle − RDV non annulés).
export async function getAvailableSlots(
  serviceId: string,
  fromISO: string,
  days: number,
  opts: { now?: Date; ignoreAppointmentId?: string } = {}
): Promise<DaySlots[]> {
  const now = opts.now ?? new Date();
  const { from: minDate, to: maxDate } = bookingWindow(now);
  const start = fromISO < minDate ? minDate : fromISO;
  const dates = Array.from({ length: days }, (_, i) => addDays(start, i)).filter((d) => d <= maxDate);
  if (dates.length === 0) return [];

  const [rules, closed] = await Promise.all([
    db.availabilityRule.findMany({ where: { serviceId, active: true } }),
    db.closedPeriod.findMany({ where: { OR: [{ serviceId }, { serviceId: null }] } }),
  ]);
  if (rules.length === 0) return [];

  const rangeStart = parisWallTimeToUtc(dates[0], 0);
  const rangeEnd = parisWallTimeToUtc(addDays(dates[dates.length - 1], 1), 0);
  const appointments = await db.appointment.findMany({
    where: {
      formality: { serviceId },
      status: "SCHEDULED",
      startAt: { gte: rangeStart, lt: rangeEnd },
      ...(opts.ignoreAppointmentId ? { id: { not: opts.ignoreAppointmentId } } : {}),
    },
    select: { startAt: true },
  });
  const bookedCount = new Map<string, number>();
  for (const a of appointments) {
    if (!a.startAt) continue;
    const k = a.startAt.toISOString();
    bookedCount.set(k, (bookedCount.get(k) ?? 0) + 1);
  }

  const notBefore = new Date(now.getTime() + MIN_NOTICE_MS);
  const result: DaySlots[] = [];

  for (const date of dates) {
    const wd = isoWeekday(date);
    const isClosed = closed.some((c) => date >= c.startDate && date <= c.endDate);
    const daySlots: Slot[] = [];
    if (!isClosed) {
      for (const rule of rules.filter((r) => r.weekday === wd)) {
        for (let m = rule.startMinute; m + rule.slotMinutes <= rule.endMinute; m += rule.slotMinutes) {
          const startAt = parisWallTimeToUtc(date, m);
          if (startAt < notBefore) continue;
          const remaining = rule.capacity - (bookedCount.get(startAt.toISOString()) ?? 0);
          if (remaining <= 0) continue;
          daySlots.push({
            startISO: startAt.toISOString(),
            endISO: new Date(startAt.getTime() + rule.slotMinutes * 60000).toISOString(),
            label: timeFmt.format(startAt),
            remaining,
          });
        }
      }
      daySlots.sort((a, b) => a.startISO.localeCompare(b.startISO));
    }
    result.push({ date, label: dayFmt.format(parisWallTimeToUtc(date, 720)), slots: daySlots });
  }
  return result;
}

// Un créneau proposé est-il toujours valide et libre ? Renvoie sa durée (min).
export async function validateSlot(
  serviceId: string,
  startISO: string,
  opts: { ignoreAppointmentId?: string } = {}
): Promise<{ ok: true; slotMinutes: number } | { ok: false; error: string }> {
  const startAt = new Date(startISO);
  if (Number.isNaN(startAt.getTime())) return { ok: false, error: "Créneau invalide." };
  const date = parisDateOf(startAt);
  const days = await getAvailableSlots(serviceId, date, 1, { ignoreAppointmentId: opts.ignoreAppointmentId });
  const slot = days[0]?.slots.find((s) => s.startISO === startAt.toISOString());
  if (!slot) return { ok: false, error: "Ce créneau n'est plus disponible. Merci d'en choisir un autre." };
  return { ok: true, slotMinutes: (new Date(slot.endISO).getTime() - startAt.getTime()) / 60000 };
}

// ---------------------------------------------------------------- référence

const REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sans I/L/O/0/1 ambigus

export function generateReference(): string {
  const bytes = crypto.randomBytes(6);
  let code = "";
  for (const b of bytes) code += REF_ALPHABET[b % REF_ALPHABET.length];
  return `LB-${code}`;
}

export function generateManageToken(): string {
  return crypto.randomBytes(24).toString("hex");
}
