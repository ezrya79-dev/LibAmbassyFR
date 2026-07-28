import { t } from "@/lib/i18n";
import { ManageBooking } from "@/components/manage-booking";

// Gestion d'un rendez-vous sans compte : référence + email suffisent.
export default async function GestionPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; t?: string }>;
}) {
  const { ref, t: token } = await searchParams;
  const dict = await t();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">{dict.manageBooking}</h1>
      <p className="mt-1 text-sm text-stone-500">{dict.manageBookingHint}</p>

      <div className="mt-6">
        <ManageBooking
          initialRef={ref}
          initialToken={token}
          labels={{
            findBooking: dict.findBooking,
            reference: dict.reference,
            email: dict.email,
            cancelBooking: dict.cancelBooking,
            moveBooking: dict.moveBooking,
            bookingCanceled: dict.bookingCanceled,
            bookingMoved: dict.bookingMoved,
            noSlots: dict.noSlots,
            prevPeriod: dict.prevPeriod,
            nextPeriod: dict.nextPeriod,
            remainingPlaces: dict.remainingPlaces,
            dateTime: dict.dateTime,
            changeSlot: dict.changeSlot,
          }}
        />
      </div>
    </div>
  );
}
