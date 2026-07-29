import Link from "next/link";
import { CalendarCheck, UserPen, CalendarSearch, AlertCircle, ArrowRight, MapPin, Phone, Clock } from "lucide-react";
import { db } from "@/lib/db";
import { t } from "@/lib/i18n";

export default async function HomePage() {
  const dict = await t();
  const blocks = await db.contentBlock.findMany({
    where: { key: { startsWith: "home.tile." }, locale: "fr" },
  });
  const get = (key: string) => blocks.find((b) => b.key === key);

  // Le dépôt de documents est reporté à un lot ultérieur : la 2e tuile sert
  // à retrouver / déplacer / annuler un RDV existant (sans compte).
  const tiles = [
    { block: get("home.tile.rdv"), href: "/rdv", icon: CalendarCheck, cta: "Réserver maintenant", fallback: dict.bookAppointment },
    { block: get("home.tile.gestion"), href: "/rdv/gestion", icon: CalendarSearch, cta: "Gérer mon RDV", fallback: dict.manageBooking },
    { block: get("home.tile.profile"), href: "/profil", icon: UserPen, cta: "Gérer mon compte", fallback: dict.editProfile },
  ];

  return (
    <div className="-mx-4 -my-8">
      {/* Hero */}
      <section className="bg-primary-container px-4 py-14 text-on-primary sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h1 className="max-w-2xl text-3xl font-bold sm:text-4xl">
            Bienvenue sur le portail consulaire
          </h1>
          <p className="mt-3 max-w-xl text-on-primary/80">
            Accédez en toute sécurité à vos démarches administratives et gérez vos rendez-vous
            officiels auprès de l'Ambassade du Liban à Paris.
          </p>
        </div>
      </section>

      {/* Tuiles */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-5 md:grid-cols-3">
          {tiles.map(({ block, href, icon: Icon, cta, fallback }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col rounded-xl border border-border-muted bg-surface-container-low p-6 transition-all hover:border-primary hover:bg-white hover:shadow-sm"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-light">
                <Icon className="h-6 w-6 text-primary" strokeWidth={1.75} />
              </span>
              <h2 className="mt-4 text-lg font-bold">{block?.title ?? fallback}</h2>
              <p className="mt-2 flex-1 text-sm text-on-surface-variant">{block?.body ?? (href === "/rdv/gestion" ? dict.manageBookingHint : null)}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                {cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>

        {/* Avis important */}
        <div className="mt-8 flex gap-3 rounded-xl border-s-4 border-status-amber bg-surface-container p-5 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-status-amber" />
          <div>
            <div className="text-xs font-bold tracking-wide uppercase">Avis important</div>
            <p className="mt-1 text-on-surface-variant">
              Veuillez vous assurer que tous vos documents originaux sont prêts avant votre
              rendez-vous. Tout dossier incomplet pourra entraîner un report de votre démarche.
            </p>
          </div>
        </div>

        {/* Infos pratiques */}
        <div className="mt-8 grid gap-4 rounded-xl border border-border-muted bg-white p-6 text-sm sm:grid-cols-3">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 shrink-0 text-primary" />
            <div><strong>Adresse</strong><br />3, Villa Copernic<br />75116 Paris</div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 shrink-0 text-primary" />
            <div><strong>Téléphone</strong><br />01.40.67.75.75<br />info@ambassadeliban.fr</div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 shrink-0 text-primary" />
            <div><strong>Horaires</strong><br />Ouverture au public<br />de 8h30 à 14h30</div>
          </div>
        </div>
      </section>
    </div>
  );
}
