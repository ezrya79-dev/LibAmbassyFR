# LibAmbassyFR — Portail e-services consulaires

Rebuild moderne et entièrement paramétrable du portail e-services d'une ambassade
(initialement bâti sur InvestGlass), pour l'Ambassade du Liban à Paris.

## Fonctionnalités

- **Frontend public** : accueil 3 modules, wizard de prise de RDV (service → formalité →
  calendrier Calendly en embed iframe), vérification de circonscription par département,
  profil usager (OTP par email), dépôt de documents (500 Mo max), i18n FR / EN / AR (RTL).
- **Console employés `/staff`** : RDV filtrables, scoping par service, fiche usager,
  statuts, notes internes, demande de pièce complémentaire, export CSV.
- **Console admin `/admin`** : CRUD services / formalités / pièces requises / taxes,
  règles de redirection, divisions administratives (import CSV), comptes & rôles RBAC + MFA,
  éditeur de contenu multilingue, branding, mapping Calendly, tableau de bord, audit log.
- **Calendly** : OAuth2 + webhooks signés (`invitee.created` / `invitee.canceled`).

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · Prisma + SQLite (PostgreSQL-ready) ·
Calendly API v2 · bcryptjs

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
