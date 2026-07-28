import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";
import { db } from "./db";

const STAFF_COOKIE = "staff_session";
const APPLICANT_COOKIE = "applicant_session";

function sessionDays() {
  return Number(process.env.SESSION_DAYS ?? "7");
}

export async function createSession(kind: "STAFF" | "APPLICANT", id: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + sessionDays() * 24 * 3600 * 1000);
  await db.session.create({
    data: {
      token,
      kind,
      userId: kind === "STAFF" ? id : null,
      applicantId: kind === "APPLICANT" ? id : null,
      expiresAt,
    },
  });
  const jar = await cookies();
  jar.set(kind === "STAFF" ? STAFF_COOKIE : APPLICANT_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(kind: "STAFF" | "APPLICANT") {
  const jar = await cookies();
  const name = kind === "STAFF" ? STAFF_COOKIE : APPLICANT_COOKIE;
  const token = jar.get(name)?.value;
  if (token) await db.session.deleteMany({ where: { token } });
  jar.delete(name);
}

export async function getStaffUser() {
  const jar = await cookies();
  const token = jar.get(STAFF_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({ where: { token } });
  if (!session || session.kind !== "STAFF" || session.expiresAt < new Date() || !session.userId)
    return null;
  return db.user.findUnique({ where: { id: session.userId } });
}

export async function getApplicant() {
  const jar = await cookies();
  const token = jar.get(APPLICANT_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({ where: { token } });
  if (
    !session ||
    session.kind !== "APPLICANT" ||
    session.expiresAt < new Date() ||
    !session.applicantId
  )
    return null;
  return db.applicant.findUnique({
    where: { id: session.applicantId },
    include: { nationalities: true },
  });
}

export async function requireStaff() {
  const user = await getStaffUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireStaff();
  if (user.role !== "ADMIN") redirect("/staff");
  return user;
}

export async function requireApplicant() {
  const applicant = await getApplicant();
  if (!applicant) redirect("/profil");
  return applicant;
}

export function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

export async function audit(userId: string | null, action: string, target?: string, meta?: unknown) {
  await db.auditLog.create({
    data: { userId, action, target, meta: meta ? JSON.stringify(meta) : null },
  });
}
