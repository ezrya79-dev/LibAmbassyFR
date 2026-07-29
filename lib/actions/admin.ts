"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireAdmin, audit } from "@/lib/auth";

const str = (v: FormDataEntryValue | null) => String(v ?? "").trim();
const num = (v: FormDataEntryValue | null) => (str(v) ? Number(str(v)) : null);
const bool = (v: FormDataEntryValue | null) => v === "on" || v === "true";

// ---------- Services ----------
export async function saveService(formData: FormData) {
  const user = await requireAdmin();
  const id = str(formData.get("id"));
  const entity = await db.entity.findFirstOrThrow();
  const data = {
    name: str(formData.get("name")),
    slug: str(formData.get("slug")) || str(formData.get("name")).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    icon: str(formData.get("icon")) || null,
    order: Number(str(formData.get("order")) || 0),
    active: bool(formData.get("active")),
    contactEmail: str(formData.get("contactEmail")) || null,
    banner: str(formData.get("banner")) || null,
    formUrl: str(formData.get("formUrl")) || null,
  };
  if (id) {
    await db.service.update({ where: { id }, data });
  } else {
    await db.service.create({ data: { ...data, entityId: entity.id } });
  }
  await audit(user.id, id ? "SERVICE_UPDATE" : "SERVICE_CREATE", data.slug);
  revalidatePath("/admin/services");
}

export async function deleteService(id: string) {
  const user = await requireAdmin();
  await db.service.delete({ where: { id } });
  await audit(user.id, "SERVICE_DELETE", id);
  revalidatePath("/admin/services");
}

// ---------- Formalités ----------
export async function saveFormality(formData: FormData) {
  const user = await requireAdmin();
  const id = str(formData.get("id"));
  const name = str(formData.get("name"));
  const data = {
    serviceId: str(formData.get("serviceId")),
    name,
    slug: str(formData.get("slug")) || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    description: str(formData.get("description")) || null,
    content: str(formData.get("content")) || null,
    taxAmount: num(formData.get("taxAmount")),
    taxMode: str(formData.get("taxMode")) || null,
    taxDetail: str(formData.get("taxDetail")) || null,
    emailContact: str(formData.get("emailContact")) || null,
    calendlyUrl: str(formData.get("calendlyUrl")) || null,
    calendlyEventTypeUri: str(formData.get("calendlyEventTypeUri")) || null,
    order: Number(str(formData.get("order")) || 0),
    active: bool(formData.get("active")),
  };
  if (id) {
    await db.formality.update({ where: { id }, data });
  } else {
    await db.formality.create({ data });
  }
  await audit(user.id, id ? "FORMALITY_UPDATE" : "FORMALITY_CREATE", data.slug);
  revalidatePath("/admin/services");
}

export async function deleteFormality(id: string) {
  const user = await requireAdmin();
  await db.formality.delete({ where: { id } });
  await audit(user.id, "FORMALITY_DELETE", id);
  revalidatePath("/admin/services");
}

export async function addRequiredDocument(formData: FormData) {
  await requireAdmin();
  const formalityId = str(formData.get("formalityId"));
  const label = str(formData.get("label"));
  if (!formalityId || !label) return;
  const max = await db.requiredDocument.aggregate({ where: { formalityId }, _max: { order: true } });
  await db.requiredDocument.create({
    data: { formalityId, label, order: (max._max.order ?? 0) + 1, required: !formData.get("optional") },
  });
  revalidatePath("/admin/services");
}

export async function deleteRequiredDocument(id: string) {
  await requireAdmin();
  await db.requiredDocument.delete({ where: { id } });
  revalidatePath("/admin/services");
}

// ---------- Règles de redirection ----------
export async function saveRedirectRule(formData: FormData) {
  const user = await requireAdmin();
  const id = str(formData.get("id"));
  const data = {
    departments: str(formData.get("departments")),
    targetName: str(formData.get("targetName")),
    message: str(formData.get("message")),
    contactEmail: str(formData.get("contactEmail")),
    active: bool(formData.get("active")),
  };
  if (id) await db.departmentRedirectRule.update({ where: { id }, data });
  else await db.departmentRedirectRule.create({ data });
  await audit(user.id, "REDIRECT_RULE_SAVE", data.targetName);
  revalidatePath("/admin/redirections");
}

export async function deleteRedirectRule(id: string) {
  const user = await requireAdmin();
  await db.departmentRedirectRule.delete({ where: { id } });
  await audit(user.id, "REDIRECT_RULE_DELETE", id);
  revalidatePath("/admin/redirections");
}

// ---------- Divisions administratives ----------
export async function addDivision(formData: FormData) {
  const user = await requireAdmin();
  const name = str(formData.get("name"));
  const level = Number(str(formData.get("level")));
  const parentId = str(formData.get("parentId")) || null;
  if (!name) return;
  await db.adminDivision.create({ data: { name, level, parentId } });
  await audit(user.id, "DIVISION_ADD", name);
  revalidatePath("/admin/divisions");
}

export async function deleteDivision(id: string) {
  const user = await requireAdmin();
  await db.adminDivision.deleteMany({ where: { OR: [{ id }, { parentId: id }] } });
  await audit(user.id, "DIVISION_DELETE", id);
  revalidatePath("/admin/divisions");
}

// Import CSV : une ligne = "Mouhafaza;Kaza;Commune" (commune optionnelle)
export async function importDivisionsCsv(formData: FormData) {
  const user = await requireAdmin();
  const csv = str(formData.get("csv"));
  let created = 0;
  for (const line of csv.split(/\r?\n/)) {
    const parts = line.split(/[;\t]/).map((p) => p.trim()).filter(Boolean);
    if (parts.length < 2) continue;
    const [mouhafaza, kaza, commune] = parts;
    let m = await db.adminDivision.findFirst({ where: { level: 1, name: mouhafaza, parentId: null } });
    if (!m) { m = await db.adminDivision.create({ data: { level: 1, name: mouhafaza } }); created++; }
    let k = await db.adminDivision.findFirst({ where: { level: 2, name: kaza, parentId: m.id } });
    if (!k) { k = await db.adminDivision.create({ data: { level: 2, name: kaza, parentId: m.id } }); created++; }
    if (commune) {
      const c = await db.adminDivision.findFirst({ where: { level: 3, name: commune, parentId: k.id } });
      if (!c) { await db.adminDivision.create({ data: { level: 3, name: commune, parentId: k.id } }); created++; }
    }
  }
  await audit(user.id, "DIVISION_CSV_IMPORT", undefined, { created });
  revalidatePath("/admin/divisions");
}

// ---------- Utilisateurs ----------
export async function saveUser(formData: FormData) {
  const user = await requireAdmin();
  const id = str(formData.get("id"));
  const password = str(formData.get("password"));
  const data: Record<string, unknown> = {
    name: str(formData.get("name")),
    email: str(formData.get("email")).toLowerCase(),
    role: str(formData.get("role")) || "AGENT",
    serviceIds: JSON.stringify(formData.getAll("serviceIds").map(String)),
    mfaEnabled: bool(formData.get("mfaEnabled")),
  };
  if (password) data.passwordHash = bcrypt.hashSync(password, 10);
  if (id) await db.user.update({ where: { id }, data: data as never });
  else {
    if (!password) throw new Error("Mot de passe requis pour un nouveau compte");
    await db.user.create({ data: data as never });
  }
  await audit(user.id, id ? "USER_UPDATE" : "USER_CREATE", data.email as string);
  revalidatePath("/admin/utilisateurs");
}

export async function deleteUser(id: string) {
  const user = await requireAdmin();
  if (user.id === id) throw new Error("Impossible de supprimer votre propre compte");
  await db.user.delete({ where: { id } });
  await audit(user.id, "USER_DELETE", id);
  revalidatePath("/admin/utilisateurs");
}

// ---------- Contenu & entité ----------
export async function saveContentBlock(formData: FormData) {
  const user = await requireAdmin();
  const key = str(formData.get("key"));
  const locale = str(formData.get("locale")) || "fr";
  const data = { title: str(formData.get("title")) || null, body: str(formData.get("body")) };
  await db.contentBlock.upsert({
    where: { key_locale: { key, locale } },
    create: { key, locale, ...data },
    update: data,
  });
  await audit(user.id, "CONTENT_SAVE", key);
  revalidatePath("/admin/contenu");
}

export async function saveEntity(formData: FormData) {
  const user = await requireAdmin();
  const entity = await db.entity.findFirstOrThrow();
  await db.entity.update({
    where: { id: entity.id },
    data: {
      name: str(formData.get("name")),
      tagline: str(formData.get("tagline")) || null,
      primaryColor: str(formData.get("primaryColor")) || "#006233",
      address: str(formData.get("address")),
      phone: str(formData.get("phone")),
      email: str(formData.get("email")),
      openingHours: str(formData.get("openingHours")),
    },
  });
  await audit(user.id, "ENTITY_UPDATE", entity.id);
  revalidatePath("/admin/contenu");
}

// ---------- Calendly ----------
// ---------- Disponibilités (moteur de créneaux natif) ----------
// Les heures sont saisies en "HH:MM" (heure de Paris) et stockées en minutes.
const toMinutes = (v: FormDataEntryValue | null) => {
  const [h, m] = str(v).split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

export async function saveAvailabilityRule(formData: FormData) {
  const user = await requireAdmin();
  const id = str(formData.get("id"));
  const data = {
    serviceId: str(formData.get("serviceId")),
    weekday: Number(str(formData.get("weekday")) || 1),
    startMinute: toMinutes(formData.get("start")),
    endMinute: toMinutes(formData.get("end")),
    slotMinutes: Math.max(5, Number(str(formData.get("slotMinutes")) || 20)),
    capacity: Math.max(1, Number(str(formData.get("capacity")) || 1)),
    active: bool(formData.get("active")),
  };
  if (data.endMinute <= data.startMinute) return;
  if (id) {
    await db.availabilityRule.update({ where: { id }, data });
  } else {
    await db.availabilityRule.create({ data });
  }
  await audit(user.id, id ? "AVAILABILITY_UPDATE" : "AVAILABILITY_CREATE", data.serviceId);
  revalidatePath("/admin/disponibilites");
}

export async function deleteAvailabilityRule(id: string) {
  const user = await requireAdmin();
  await db.availabilityRule.delete({ where: { id } });
  await audit(user.id, "AVAILABILITY_DELETE", id);
  revalidatePath("/admin/disponibilites");
}

export async function saveClosedPeriod(formData: FormData) {
  const user = await requireAdmin();
  const startDate = str(formData.get("startDate"));
  const endDate = str(formData.get("endDate")) || startDate;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || endDate < startDate) return;
  await db.closedPeriod.create({
    data: {
      serviceId: str(formData.get("serviceId")) || null,
      startDate,
      endDate,
      reason: str(formData.get("reason")) || null,
    },
  });
  await audit(user.id, "CLOSED_PERIOD_CREATE", `${startDate}→${endDate}`);
  revalidatePath("/admin/disponibilites");
}

export async function deleteClosedPeriod(id: string) {
  const user = await requireAdmin();
  await db.closedPeriod.delete({ where: { id } });
  await audit(user.id, "CLOSED_PERIOD_DELETE", id);
  revalidatePath("/admin/disponibilites");
}

export async function saveCalendlySettings(formData: FormData) {
  const user = await requireAdmin();
  const existing = await db.calendlyConnection.findUnique({ where: { singleton: "main" } });
  const webhookSigningKey = str(formData.get("webhookSigningKey")) || null;
  if (existing) {
    await db.calendlyConnection.update({ where: { singleton: "main" }, data: { webhookSigningKey } });
  } else {
    await db.calendlyConnection.create({ data: { singleton: "main", webhookSigningKey } });
  }
  await audit(user.id, "CALENDLY_SETTINGS");
  revalidatePath("/admin/calendly");
}

export async function disconnectCalendly() {
  const user = await requireAdmin();
  await db.calendlyConnection.update({
    where: { singleton: "main" },
    data: { accessToken: null, refreshToken: null, organizationUri: null, connectedAt: null },
  });
  await audit(user.id, "CALENDLY_DISCONNECT");
  revalidatePath("/admin/calendly");
}

// ---------- Rendez-vous de test (démo) ----------
export async function createTestAppointment() {
  const user = await requireAdmin();
  const formality = await db.formality.findFirst({ where: { active: true }, orderBy: { order: "asc" } });
  if (!formality) return;
  const applicant = await db.applicant.upsert({
    where: { email: "demo.usager@example.fr" },
    create: { email: "demo.usager@example.fr", firstName: "Demo", lastName: "Usager", phone: "0600000000" },
    update: {},
  });
  const start = new Date(Date.now() + 3 * 24 * 3600 * 1000);
  start.setHours(10, 0, 0, 0);
  await db.appointment.create({
    data: {
      applicantId: applicant.id,
      formalityId: formality.id,
      startAt: start,
      endAt: new Date(start.getTime() + 30 * 60000),
      status: "SCHEDULED",
    },
  });
  await audit(user.id, "TEST_APPOINTMENT", applicant.email);
  revalidatePath("/admin");
}
