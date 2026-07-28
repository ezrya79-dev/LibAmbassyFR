import Link from "next/link";
import { CalendarCheck, UserPen, Paperclip } from "lucide-react";
import { db } from "@/lib/db";
import { t } from "@/lib/i18n";

export default async function HomePage() {
  const dict = await t();
  const blocks = await db.contentBlock.findMany({
    where: { key: { startsWith: "home.tile." }, locale: "fr" },
  });
  const get = (key: string) => blocks.find((b) => b.key === key);

  const tiles = [
    { block: get("home.tile.rdv"), href: "/rdv", icon: CalendarCheck, fallback: dict.bookAppointment },
    { block: get("home.tile.profile"), href: "/profil", icon: UserPen, fallback: dict.editProfile },
    { block: get("home.tile.documents"), href: "/documents", icon: Paperclip, fallback: dict.attachDocuments },
  ];

  return (
    <div>
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-[var(--brand)]">Portail e-services consulaires</h1>
        <p className="mt-2 text-stone-500">Ambassade du Liban en France — 3, Villa Copernic 75116 Paris</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {tiles.map(({ block, href, icon: Icon, fallback }) => (
          <div
            key={href}
            className="flex flex-col rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm transition-shadow hover:shadow-md"
          >
            <Icon className="mx-auto h-12 w-12 text-[var(--brand)]" strokeWidth={1.5} />
            <h2 className="mt-4 text-lg font-bold">{block?.title ?? fallback}</h2>
            <p className="mt-2 flex-1 text-sm text-stone-500">{block?.body}</p>
            <Link
              href={href}
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-[var(--brand)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-dark)]"
            >
              {dict.start}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
