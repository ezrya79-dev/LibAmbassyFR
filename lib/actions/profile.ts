"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireApplicant } from "@/lib/auth";

export async function saveProfile(prevState: { ok?: boolean; error?: string } | null, formData: FormData) {
  const applicant = await requireApplicant();

  const data = {
    firstName: String(formData.get("firstName") ?? "").trim(),
    lastName: String(formData.get("lastName") ?? "").trim(),
    birthDate: String(formData.get("birthDate") ?? "") || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    addressFrStreet: String(formData.get("addressFrStreet") ?? "").trim() || null,
    addressFrZip: String(formData.get("addressFrZip") ?? "").trim() || null,
    addressFrCity: String(formData.get("addressFrCity") ?? "").trim() || null,
    addressFrDept: String(formData.get("addressFrDept") ?? "").trim() || null,
    mouhafazaId: String(formData.get("mouhafazaId") ?? "") || null,
    kazaId: String(formData.get("kazaId") ?? "") || null,
    communeId: String(formData.get("communeId") ?? "") || null,
  };
  if (!data.firstName || !data.lastName) {
    return { error: "Prénom et nom de famille sont obligatoires." };
  }

  await db.applicant.update({ where: { id: applicant.id }, data });

  // Nationalités (jusqu'à 3)
  await db.nationality.deleteMany({ where: { applicantId: applicant.id } });
  for (let rank = 1; rank <= 3; rank++) {
    const country = String(formData.get(`nationality${rank}`) ?? "").trim();
    if (country) {
      await db.nationality.create({ data: { applicantId: applicant.id, rank, country } });
    }
  }

  revalidatePath("/profil/espace");
  return { ok: true };
}
