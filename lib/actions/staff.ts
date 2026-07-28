"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStaff, audit } from "@/lib/auth";

export async function setAppointmentStatus(appointmentId: string, status: string) {
  const user = await requireStaff();
  await db.appointment.update({ where: { id: appointmentId }, data: { status } });
  await audit(user.id, "APPOINTMENT_STATUS", appointmentId, { status });
  revalidatePath("/staff");
}

export async function addApplicantNote(applicantId: string, note: string) {
  const user = await requireStaff();
  const applicant = await db.applicant.findUnique({ where: { id: applicantId } });
  const stamp = `[${new Date().toLocaleString("fr-FR")} — ${user.name}] ${note}`;
  await db.applicant.update({
    where: { id: applicantId },
    data: { notes: applicant?.notes ? `${applicant.notes}\n${stamp}` : stamp },
  });
  await audit(user.id, "APPLICANT_NOTE", applicantId);
  revalidatePath(`/staff/usagers/${applicantId}`);
}

export async function setDocumentStatus(documentId: string, status: string, applicantId: string) {
  const user = await requireStaff();
  await db.document.update({ where: { id: documentId }, data: { status } });
  await audit(user.id, "DOCUMENT_STATUS", documentId, { status });
  // En production : notification email à l'usager
  revalidatePath(`/staff/usagers/${applicantId}`);
}

export async function requestMoreInfo(applicantId: string, message: string) {
  const user = await requireStaff();
  await db.applicant.update({ where: { id: applicantId }, data: { status: "PIECE_COMPLEMENTAIRE" } });
  await addApplicantNote(applicantId, `Demande de pièce complémentaire : ${message}`);
  await audit(user.id, "REQUEST_MORE_INFO", applicantId, { message });
  // En production : email automatique à l'usager avec le message
}
