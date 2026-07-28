"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession, generateOtp, audit } from "@/lib/auth";

export async function setLocale(locale: string) {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  jar.set("locale", ["fr", "en", "ar"].includes(locale) ? locale : "fr", { path: "/" });
}

// ---------- Staff auth ----------
export async function staffLogin(prevState: { error?: string } | null, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const mfaCode = String(formData.get("mfaCode") ?? "");

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return { error: "Identifiants invalides." };
  }

  // MFA obligatoire si activé sur le compte (code à 6 chiffres — en démo : affiché dans la console serveur)
  if (user.mfaEnabled) {
    if (!mfaCode) {
      const code = generateOtp();
      await db.otpCode.create({
        data: { email, code, purpose: "MFA", expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
      });
      console.log(`[MFA démo] Code pour ${email} : ${code}`);
      return { error: `MFA requis — code généré (console serveur / email en production). Saisissez-le et reconnectez-vous.` };
    }
    const otp = await db.otpCode.findFirst({
      where: { email, code: mfaCode, purpose: "MFA", consumed: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (!otp) return { error: "Code MFA invalide ou expiré." };
    await db.otpCode.update({ where: { id: otp.id }, data: { consumed: true } });
  }

  await createSession("STAFF", user.id);
  await audit(user.id, "LOGIN", user.email);
  redirect(user.role === "ADMIN" ? "/admin" : "/staff");
}

export async function staffLogout() {
  await destroySession("STAFF");
  redirect("/login");
}

// ---------- Applicant OTP auth ----------
export async function requestOtp(prevState: { error?: string; devCode?: string } | null, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) return { error: "Adresse email invalide." };
  const code = generateOtp();
  await db.otpCode.create({
    data: { email, code, purpose: "LOGIN", expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
  });
  console.log(`[OTP démo] Code pour ${email} : ${code}`);
  // En production : envoi par email. En démo : le code est renvoyé à l'écran.
  return { devCode: code };
}

export async function verifyOtp(prevState: { error?: string } | null, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const code = String(formData.get("code") ?? "").trim();
  const otp = await db.otpCode.findFirst({
    where: { email, code, purpose: "LOGIN", consumed: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) return { error: "Code invalide ou expiré." };
  await db.otpCode.update({ where: { id: otp.id }, data: { consumed: true } });

  let applicant = await db.applicant.findUnique({ where: { email } });
  if (!applicant) {
    applicant = await db.applicant.create({
      data: { email, firstName: "", lastName: "" },
    });
  }
  await createSession("APPLICANT", applicant.id);
  redirect("/profil/espace");
}

export async function applicantLogout() {
  await destroySession("APPLICANT");
  redirect("/");
}
