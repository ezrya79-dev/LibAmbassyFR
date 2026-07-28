import Link from "next/link";
import { Cedar } from "@/components/cedar";
import { db } from "@/lib/db";
import { getLocale, t, dir, type Locale } from "@/lib/i18n";
import { getStaffUser, getApplicant } from "@/lib/auth";
import { LocaleSwitcher } from "@/components/locale-switcher";
import "./globals.css";

export const metadata = {
  title: "Ambassade du Liban à Paris — e-services",
  description: "Portail e-services consulaires",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale: Locale = await getLocale();
  const dict = await t();
  const entity = await db.entity.findFirst();
  const staff = await getStaffUser();
  const applicant = await getApplicant();

  return (
    <html lang={locale} dir={dir(locale)}>
      <body className="flex min-h-screen flex-col">
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="flex items-center gap-3">
              <Cedar className="h-10 w-10 text-[var(--brand)]" />
              <div>
                <div className="font-semibold leading-tight">{entity?.name ?? "Ambassade du Liban à Paris"}</div>
                <div className="text-xs text-stone-500">{entity?.tagline}</div>
              </div>
            </Link>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/" className="rounded-lg px-3 py-2 hover:bg-stone-100">
                {dict.home}
              </Link>
              <Link href="/profil" className="rounded-lg px-3 py-2 hover:bg-stone-100">
                {dict.myAccount}
              </Link>
              {staff ? (
                <Link
                  href={staff.role === "ADMIN" ? "/admin" : "/staff"}
                  className="rounded-lg bg-stone-800 px-3 py-2 text-white hover:bg-stone-700"
                >
                  {staff.role === "ADMIN" ? dict.adminArea : dict.staffArea}
                </Link>
              ) : (
                <Link href="/login" className="rounded-lg px-3 py-2 text-stone-500 hover:bg-stone-100">
                  {dict.staffArea}
                </Link>
              )}
              <LocaleSwitcher current={locale} />
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>

        <footer className="mt-auto border-t border-stone-200 bg-stone-800 text-stone-200">
          <div className="mx-auto grid max-w-6xl gap-2 px-4 py-6 text-sm sm:grid-cols-2">
            <div>
              <div className="font-semibold text-white">{entity?.name} en France</div>
              <div>{entity?.address}</div>
            </div>
            <div className="sm:text-end">
              <div>Téléphone : {entity?.phone}</div>
              <div>Email : {entity?.email}</div>
              <div>{entity?.openingHours}</div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
