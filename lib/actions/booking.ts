"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  generateManageToken,
  generateReference,
  isoWeekday,
  parisDateOf,
  parisMinuteOfDay,
  validateSlot,
} from "@/lib/booking";

const str = (v: FormDataEntryValue | null) => String(v ?? "").trim();

export type BookingResult =
  | { ok: true; reference: string; token: string }
  | { ok: false; error: string };

// Réservation sans compte : identité minimale + créneau. L'usager est
// rattaché (ou créé) par email — s'il se connecte plus tard via OTP avec le
// même email, il retrouvera ses rendez-vous dans son espace.
export async function bookAppointment(formData: FormData): Promise<BookingResult> {
  const formalityId = str(formData.get("formalityId"));
  const startISO = str(formData.get("startISO"));
  const firstName = str(formData.get("firstName"));
  const lastName = str(formData.get("lastName"));
  const email = str(formData.get("email")).toLowerCase();
  const phone = str(formData.get("phone"));

  if (!firstName || !lastName) return { ok: false, error: "Merci d'indiquer votre nom et votre prénom." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Adresse email invalide." };

  const formality = await db.formality.findUnique({ where: { id: formalityId } });
  if (!formality || !formality.active) return { ok: false, error: "Formalité introuvable." };

  const slot = await validateSlot(formality.serviceId, startISO);
  if (!slot.ok) return { ok: false, error: slot.error };

  const startAt = new Date(startISO);
  const endAt = new Date(startAt.getTime() + slot.slotMinutes * 60000);
  const reference = generateReference();
  const token = generateManageToken();

  try {
    await db.$transaction(async (tx) => {
      // Revérification de la capacité dans la transaction : deux usagers ne
      // peuvent pas valider le même dernier créneau.
      const weekday = isoWeekday(parisDateOf(startAt));
      const minute = parisMinuteOfDay(startAt);
      const rules = await tx.availabilityRule.findMany({
        where: { serviceId: formality.serviceId, active: true, weekday },
      });
      const capacity = Math.max(
        0,
        ...rules.filter((r) => minute >= r.startMinute && minute < r.endMinute).map((r) => r.capacity)
      );
      const taken = await tx.appointment.count({
        where: { formality: { serviceId: formality.serviceId }, status: "SCHEDULED", startAt },
      });
      if (taken >= capacity) throw new Error("SLOT_TAKEN");

      const applicant = await tx.applicant.upsert({
        where: { email },
        update: { firstName, lastName, ...(phone ? { phone } : {}) },
        create: { firstName, lastName, email, phone: phone || null },
      });
      await tx.appointment.create({
        data: {
          applicantId: applicant.id,
          formalityId,
          reference,
          manageToken: token,
          status: "SCHEDULED",
          startAt,
          endAt,
        },
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "SLOT_TAKEN")
      return { ok: false, error: "Ce créneau vient d'être réservé. Merci d'en choisir un autre." };
    throw e;
  }

  revalidatePath("/staff");
  return { ok: true, reference, token };
}

export type ManagedAppointment = {
  reference: string;
  token: string;
  status: string;
  startISO: string | null;
  endISO: string | null;
  serviceId: string;
  serviceName: string;
  formalityName: string;
  firstName: string;
};

// Retrouver un RDV soit par référence + email (saisie manuelle), soit par
// référence + jeton (lien de confirmation) — jamais par référence seule.
export async function lookupAppointment(
  reference: string,
  proof: { email?: string; token?: string }
): Promise<{ ok: true; appointment: ManagedAppointment } | { ok: false; error: string }> {
  const ref = reference.trim().toUpperCase();
  const appt = await db.appointment.findUnique({
    where: { reference: ref },
    include: { applicant: true, formality: { include: { service: true } } },
  });
  const emailOk = proof.email && appt?.applicant.email === proof.email.trim().toLowerCase();
  const tokenOk = proof.token && appt?.manageToken === proof.token;
  if (!appt || !appt.manageToken || (!emailOk && !tokenOk))
    return { ok: false, error: "Aucun rendez-vous trouvé pour cette référence et cet email." };
  return {
    ok: true,
    appointment: {
      reference: ref,
      token: appt.manageToken,
      status: appt.status,
      startISO: appt.startAt?.toISOString() ?? null,
      endISO: appt.endAt?.toISOString() ?? null,
      serviceId: appt.formality.serviceId,
      serviceName: appt.formality.service.name,
      formalityName: appt.formality.name,
      firstName: appt.applicant.firstName,
    },
  };
}

async function findByToken(reference: string, token: string) {
  const appt = await db.appointment.findUnique({
    where: { reference: reference.trim().toUpperCase() },
    include: { formality: true },
  });
  if (!appt || !appt.manageToken || appt.manageToken !== token) return null;
  return appt;
}

export async function cancelAppointment(
  reference: string,
  token: string
): Promise<{ ok: boolean; error?: string }> {
  const appt = await findByToken(reference, token);
  if (!appt) return { ok: false, error: "Rendez-vous introuvable." };
  if (appt.status !== "SCHEDULED") return { ok: false, error: "Ce rendez-vous n'est plus modifiable." };
  await db.appointment.update({ where: { id: appt.id }, data: { status: "CANCELED" } });
  revalidatePath("/staff");
  return { ok: true };
}

export async function rescheduleAppointment(
  reference: string,
  token: string,
  newStartISO: string
): Promise<{ ok: boolean; error?: string }> {
  const appt = await findByToken(reference, token);
  if (!appt) return { ok: false, error: "Rendez-vous introuvable." };
  if (appt.status !== "SCHEDULED") return { ok: false, error: "Ce rendez-vous n'est plus modifiable." };

  const slot = await validateSlot(appt.formality.serviceId, newStartISO, { ignoreAppointmentId: appt.id });
  if (!slot.ok) return { ok: false, error: slot.error };

  const startAt = new Date(newStartISO);
  await db.appointment.update({
    where: { id: appt.id },
    data: { startAt, endAt: new Date(startAt.getTime() + slot.slotMinutes * 60000) },
  });
  revalidatePath("/staff");
  return { ok: true };
}
