import Link from "next/link";
import { LayoutDashboard, Settings2, MapPin, Globe2, CalendarClock, Calendar, Users2, FileEdit } from "lucide-react";

const LINKS = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/admin/services", label: "Services & Formalités", icon: Settings2 },
  { href: "/admin/disponibilites", label: "Disponibilités", icon: CalendarClock },
  { href: "/admin/redirections", label: "Redirections", icon: MapPin },
  { href: "/admin/divisions", label: "Divisions (Liban)", icon: Globe2 },
  { href: "/admin/calendly", label: "Calendly (option)", icon: Calendar },
  { href: "/admin/utilisateurs", label: "Comptes & rôles", icon: Users2 },
  { href: "/admin/contenu", label: "Contenu & marque", icon: FileEdit },
];

export function AdminNav({ current }: { current: string }) {
  return (
    <nav className="mb-6 flex flex-wrap gap-1 rounded-xl border border-stone-200 bg-white p-1">
      {LINKS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm ${
            current === href ? "bg-[var(--brand)] font-medium text-white" : "hover:bg-stone-100"
          }`}
        >
          <Icon className="h-4 w-4" /> {label}
        </Link>
      ))}
    </nav>
  );
}
