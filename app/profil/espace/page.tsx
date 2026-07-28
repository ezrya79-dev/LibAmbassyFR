import Link from "next/link";
import { CalendarDays, Settings2 } from "lucide-react";
import { requireApplicant } from "@/lib/auth";
import { applicantLogout } from "@/lib/actions/auth";
import { db } from "@/lib/db";
import { t } from "@/lib/i18n";
import { BOOKING_TZ } from "@/lib/booking";
import { ProfileForm } from "@/components/profile-form";
import { Badge, Button, Card } from "@/components/ui";

const dtFmt = new Intl.DateTimeFormat("fr-FR", {
  timeZone: BOOKING_TZ,
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function EspacePage() {
  const dict = await t();
  const applicant = await requireApplicant();

  const [divisionNames, appointments] = await Promise.all([
    db.adminDivision.findMany({
      where: { id: { in: [applicant.mouhafazaId, applicant.kazaId, applicant.communeId].filter(Boolean) as string[] } },
    }),
    db.appointment.findMany({
      where: { applicantId: applicant.id, startAt: { not: null } },
      include: { formality: { include: { service: true } } },
      orderBy: { startAt: "desc" },
      take: 50,
    }),
  ]);
  const now = new Date();
  const upcoming = appointments.filter((a) => a.startAt! >= now && a.status === "SCHEDULED").reverse();
  const past = appointments.filter((a) => a.startAt! < now || a.status !== "SCHEDULED");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{dict.editProfile}</h1>
          <p className="text-sm text-stone-500">{applicant.email}</p>
        </div>
        <form action={applicantLogout}>
          <Button variant="outline" type="submit">{dict.logout}</Button>
        </form>
      </div>

      {/* L'enregistrement reste optionnel : ces RDV ont pu être pris sans
          compte — ils sont rattachés par email. */}
      {appointments.length > 0 && (
        <div className="mb-8 space-y-4">
          <h2 className="text-lg font-semibold">{dict.myAppointments}</h2>
          {[
            { title: dict.upcoming, list: upcoming },
            { title: dict.pastAppointments, list: past },
          ].map(
            ({ title, list }) =>
              list.length > 0 && (
                <div key={title}>
                  <div className="mb-2 text-sm font-medium text-stone-500">{title}</div>
                  <div className="space-y-2">
                    {list.map((a) => (
                      <Card key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                        <div className="flex items-center gap-3">
                          <CalendarDays className="h-5 w-5 text-[var(--brand)]" />
                          <div>
                            <div className="text-sm font-medium capitalize">{dtFmt.format(a.startAt!)}</div>
                            <div className="text-xs text-stone-500">
                              {a.formality.service.name} · {a.formality.name}
                              {a.reference && <> · {a.reference}</>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            tone={
                              a.status === "SCHEDULED" ? "green" : a.status === "CANCELED" ? "red" : "neutral"
                            }
                          >
                            {a.status === "SCHEDULED" ? "Confirmé" : a.status === "CANCELED" ? "Annulé" : a.status}
                          </Badge>
                          {a.reference && a.manageToken && a.status === "SCHEDULED" && a.startAt! >= now && (
                            <Link
                              href={`/rdv/gestion?ref=${a.reference}&t=${a.manageToken}`}
                              className="inline-flex items-center gap-1 text-sm text-[var(--brand)] hover:underline"
                            >
                              <Settings2 className="h-4 w-4" /> {dict.manageBooking}
                            </Link>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )
          )}
        </div>
      )}

      <ProfileForm
        initial={{
          firstName: applicant.firstName,
          lastName: applicant.lastName,
          birthDate: applicant.birthDate,
          phone: applicant.phone,
          email: applicant.email,
          addressFrStreet: applicant.addressFrStreet,
          addressFrZip: applicant.addressFrZip,
          addressFrCity: applicant.addressFrCity,
          addressFrDept: applicant.addressFrDept,
          mouhafazaId: applicant.mouhafazaId,
          kazaId: applicant.kazaId,
          communeId: applicant.communeId,
          nationalities: applicant.nationalities,
        }}
        saveLabel={dict.save}
        savedLabel={dict.profileSaved}
      />
      <p className="sr-only">{divisionNames.map((d) => d.name).join(", ")}</p>
    </div>
  );
}
