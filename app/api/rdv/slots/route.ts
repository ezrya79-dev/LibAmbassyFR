import { NextRequest, NextResponse } from "next/server";
import {
  CALENDAR_PAGE_DAYS,
  MAX_DAYS_AHEAD,
  addDays,
  bookingWindow,
  getAvailableSlots,
  parisDateOf,
} from "@/lib/booking";

// GET /api/rdv/slots?serviceId=…&from=YYYY-MM-DD
// Créneaux disponibles sur une page de calendrier (public : aucune donnée personnelle).
export async function GET(req: NextRequest) {
  const serviceId = req.nextUrl.searchParams.get("serviceId") ?? "";
  if (!serviceId) return NextResponse.json({ error: "serviceId requis" }, { status: 400 });

  const { from: minDate, to: maxDate } = bookingWindow();
  const requested = req.nextUrl.searchParams.get("from") ?? minDate;
  const from = /^\d{4}-\d{2}-\d{2}$/.test(requested) && requested >= minDate ? requested : minDate;
  if (from > maxDate) return NextResponse.json({ days: [], prevFrom: null, nextFrom: null });

  const days = await getAvailableSlots(serviceId, from, CALENDAR_PAGE_DAYS);

  const prevCandidate = addDays(from, -CALENDAR_PAGE_DAYS);
  const nextCandidate = addDays(from, CALENDAR_PAGE_DAYS);
  return NextResponse.json({
    days,
    today: parisDateOf(new Date()),
    prevFrom: from > minDate ? (prevCandidate < minDate ? minDate : prevCandidate) : null,
    nextFrom: nextCandidate <= maxDate ? nextCandidate : null,
    maxDaysAhead: MAX_DAYS_AHEAD,
  });
}
