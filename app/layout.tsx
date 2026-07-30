import { Noto_Sans, Noto_Sans_Arabic } from "next/font/google";
import { db } from "@/lib/db";
import { getLocale, t, dir, type Locale } from "@/lib/i18n";
import { getStaffUser } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-noto",
});
const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "600", "700"],
  variable: "--font-arabic",
});

export const metadata = {
  title: "Ambassade du Liban à Paris — e-services",
  description: "Portail e-services consulaires",
};

// Zoom laissé libre (accessibilité) ; viewport-fit pour les encoches iPhone.
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale: Locale = await getLocale();
  const dict = await t();
  const entity = await db.entity.findFirst();
  const staff = await getStaffUser();

  const navLinks = [
    { href: "/", label: dict.home },
    { href: "/rdv/gestion", label: dict.manageBooking },
    { href: "/profil", label: dict.myAccount },
    staff
      ? {
          href: staff.role === "ADMIN" ? "/admin" : "/staff",
          label: staff.role === "ADMIN" ? dict.adminArea : dict.staffArea,
          emphasis: true,
        }
      : { href: "/login", label: dict.staffArea },
  ];

  return (
    <html lang={locale} dir={dir(locale)} className={`${notoSans.variable} ${notoArabic.variable}`}>
      <body className="flex min-h-screen flex-col">
        <SiteHeader
          entityName={entity?.name ?? "Ambassade du Liban à Paris"}
          tagline={entity?.tagline}
          links={navLinks}
          locale={locale}
          menuLabel={dict.menu}
        />

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">{children}</main>

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
