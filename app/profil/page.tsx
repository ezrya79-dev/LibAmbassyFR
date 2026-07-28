import { redirect } from "next/navigation";
import { getApplicant } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { OtpLogin } from "@/components/otp-login";

export default async function ProfilPage() {
  const dict = await t();
  const applicant = await getApplicant();
  if (applicant) redirect("/profil/espace");

  return (
    <div>
      <h1 className="mb-2 text-center text-2xl font-bold">{dict.myAccount}</h1>
      <p className="mb-8 text-center text-sm text-stone-500">
        Connectez-vous avec votre adresse email (code à usage unique).
      </p>
      <OtpLogin
        labels={{
          email: dict.email,
          otpCode: dict.otpCode,
          verify: dict.verify,
          otpSent: dict.otpSent,
          login: dict.login,
        }}
      />
    </div>
  );
}
