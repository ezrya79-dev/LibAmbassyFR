# LibAmbassyFR — Portail e-services consulaires

Rebuild moderne et entièrement paramétrable du portail e-services d'une ambassade
(initialement bâti sur InvestGlass), pour l'Ambassade du Liban à Paris.

## Fonctionnalités

- **Prise de RDV native, sans compte** : service → formalité (pièces à fournir affichées
  avant le calendrier) → créneau → coordonnées → **écran de confirmation final**
  (date, durée, adresse, pièces à apporter, taxe, référence, export .ics).
  Vérification de circonscription par département. Anti double-réservation.
- **Gestion de RDV sans compte** (`/rdv/gestion`) : retrouver, déplacer ou annuler
  avec référence + email. Espace personnel optionnel (OTP email) listant les RDV
  passés et à venir. i18n FR / EN / AR (RTL).
- **Console employés `/staff`** : RDV en temps réel (référence, filtres, scoping par
  service), fiche usager, statuts, notes internes, export CSV.
- **Console admin `/admin`** : **disponibilités par service** (plages hebdomadaires,
  durée des RDV, guichets, fermetures exceptionnelles), CRUD services / formalités /
  pièces / taxes, redirections, divisions (import CSV), comptes & rôles, contenu
  multilingue, branding, tableau de bord, audit log.
- **Calendly (optionnel, hors parcours)** : OAuth2 + webhooks signés conservés pour
  une éventuelle transition — voir [`docs/PARCOURS-RDV.md`](docs/PARCOURS-RDV.md).

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · Prisma + SQLite (PostgreSQL-ready) ·
bcryptjs

## Démarrage

```bash
npm install
cp .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

Comptes démo (seed) :
- `admin@ambassadeliban.fr / Admin123!`
- `superviseur@ambassadeliban.fr / Super123!`
- `agent.passeport@ambassadeliban.fr / Agent123!`

## Contenu de référence

Le dossier [`content/`](content) contient les textes/services/formalités extraits du portail
actuel, utilisés comme données d'amorçage (seed). Aucun contenu n'est codé en dur dans le
front-end : tout est éditable depuis la console d'administration. Les sections marquées
`[À COMPLÉTER]` sont à renseigner via `/admin/services`.

Voir [`PROMPT-REBUILD.md`](PROMPT-REBUILD.md) pour le cahier des charges complet.

## Déploiement

Mise en production sur VPS (Docker + nginx + TLS Let's Encrypt) :
voir [`DEPLOY.md`](DEPLOY.md).

```bash
# sur le VPS, en root
LETSENCRYPT_EMAIL=vous@exemple.fr bash deploy/install-vps.sh
```
