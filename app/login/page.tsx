import { redirect } from "next/navigation";
import { getStaffUser } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { StaffLoginForm } from "@/components/staff-login-form";

export default async function LoginPage() {
  const dict = await t();
  const staff = await getStaffUser();
  if (staff) redirect(staff.role === "ADMIN" ? "/admin" : "/staff");

  return (
    <div>
      <h1 className="mb-8 text-center text-2xl font-bold">{dict.staffArea}</h1>
      <StaffLoginForm labels={{ email: dict.email, password: dict.password, login: dict.login }} />
    </div>
  );
}
