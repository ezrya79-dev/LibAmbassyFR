import { requireApplicant } from "@/lib/auth";
import { applicantLogout } from "@/lib/actions/auth";
import { db } from "@/lib/db";
import { t } from "@/lib/i18n";
import { ProfileForm } from "@/components/profile-form";
import { Button } from "@/components/ui";

export default async function EspacePage() {
  const dict = await t();
  const applicant = await requireApplicant();

  const divisionNames = await db.adminDivision.findMany({
    where: { id: { in: [applicant.mouhafazaId, applicant.kazaId, applicant.communeId].filter(Boolean) as string[] } },
  });

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
