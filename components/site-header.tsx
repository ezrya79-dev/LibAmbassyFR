"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Cedar } from "@/components/cedar";
import { LocaleSwitcher } from "@/components/locale-switcher";

type NavLink = { href: string; label: string; emphasis?: boolean };

// En-tête responsive : la navigation complète tient sur desktop ; en dessous de
// `sm` elle passe dans un menu déroulant (hamburger), conformément au portail
// d'origine. Sans cela, la barre débordait de ~145 px sur un écran de 375 px,
// provoquant un défilement horizontal sur toutes les pages.
export function SiteHeader({
  entityName,
  tagline,
  links,
  locale,
  menuLabel,
}: {
  entityName: string;
  tagline?: string | null;
  links: NavLink[];
  locale: string;
  menuLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Referme le menu à la navigation : sinon il reste ouvert sur la page suivante.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="border-b border-border-muted bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex min-h-11 min-w-0 items-center gap-2 sm:gap-3">
          <Cedar className="h-9 w-9 shrink-0 text-primary sm:h-10 sm:w-10" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold leading-tight sm:text-base">{entityName}</div>
            {tagline && <div className="truncate text-xs text-on-surface-variant">{tagline}</div>}
          </div>
        </Link>

        {/* Navigation desktop */}
        <nav className="hidden items-center gap-1 text-sm sm:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={
                l.emphasis
                  ? "inline-flex min-h-11 items-center rounded-lg bg-on-surface px-3 text-white hover:opacity-90"
                  : "inline-flex min-h-11 items-center rounded-lg px-3 hover:bg-surface-container"
              }
            >
              {l.label}
            </Link>
          ))}
          <LocaleSwitcher current={locale} />
        </nav>

        {/* Déclencheur mobile */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={menuLabel}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border-muted text-on-surface sm:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Panneau mobile */}
      {open && (
        <nav id="mobile-nav" className="border-t border-border-muted bg-white px-4 py-2 sm:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex min-h-12 items-center rounded-lg px-2 text-sm hover:bg-surface-container"
            >
              {l.label}
            </Link>
          ))}
          <div className="border-t border-border-muted py-3">
            <LocaleSwitcher current={locale} />
          </div>
        </nav>
      )}
    </header>
  );
}
