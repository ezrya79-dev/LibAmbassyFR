# Prompt — Rebuild du portail e-services consulaires (Ambassade du Liban à Paris)

## Contexte
Tu es chargé de reconstruire, moderniser et rendre entièrement paramétrable le portail
e-services d'un consulat/ambassade actuellement bâti sur InvestGlass. Le contenu de
référence (textes, services, formalités, listes) se trouve dans le dossier `/content`
(fichiers 00 à 10). Utilise ce contenu comme données d'amorçage (seed data), pas comme
texte codé en dur.

## Objectifs
1. Reproduire fidèlement le parcours utilisateur actuel : Accueil (3 modules) → Prise de
   RDV (Service → Formalité → Calendrier) → Profil usager → Dépôt de documents.
2. Rendre 100% du contenu paramétrable depuis une console d'administration (aucun texte,
   liste ou email ne doit être codé en dur dans le front-end).
3. Intégrer Calendly nativement (API v2 + webhooks), un Event Type par couple
   Service/Formalité, embed iframe in-page.
4. Livrer deux back-offices distincts : une console de gestion pour les employés du
   consulat, et une console de paramétrage pour les administrateurs.

## Stack recommandée
- Frontend : Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- Backend : API routes Next.js ou service Node/NestJS séparé
- Base de données : PostgreSQL + Prisma ORM
- Auth : NextAuth (usagers : email + OTP ; employés/admins : credentials + MFA obligatoire)
- Stockage documents : S3-compatible (avec chiffrement au repos)
- Intégration : Calendly API v2 (OAuth2) + Webhooks Calendly signés
- i18n : next-intl (français / arabe RTL / anglais)

## Modèle de données (à créer avec Prisma)
- `Entity` (ambassade/consulat, multi-tenant) : nom, logo, couleurs, adresse, téléphone, email, horaires
- `Service` : entityId, nom, ordre, actif
- `Formality` : serviceId, nom, description, documentsRequis[], taxeMontant, taxeMode,
  emailContact, calendlyEventTypeUri, ordre, actif
- `RequiredDocument` : formalityId, libellé, obligatoire (bool)
- `Applicant` (usager) : infos personnelles, nationalités[] (avec pièce jointe), adresse
  France, adresse Liban (mouhafazaId, kazaId, communeId)
- `AdminDivision` (Mouhafaza / Kaza / Commune) : hiérarchie paramétrable, extensible à
  d'autres pays
- `DepartmentRedirectRule` : liste des départements FR redirigeant vers une autre
  circonscription, + message + email de contact
- `Appointment` : applicantId, formalityId, calendlyEventUri, statut, date/heure, notes
- `Document` : applicantId, appointmentId, type, fichier, statut de validation
- `User` (employé/admin) : rôle (agent, superviseur, admin), serviceIds[] (scoping)
- `AuditLog` : userId, action, cible, horodatage

## Frontend public (à construire)
- Page d'accueil avec 3 tuiles configurables (icône, titre, lien).
- Assistant de prise de RDV en 3 étapes (wizard), données Service/Formalité chargées
  depuis l'API, redirection conditionnelle si département usager correspond à une
  `DepartmentRedirectRule`.
- Étape finale : Calendly Inline Widget chargé dynamiquement selon
  `formality.calendlyEventTypeUri`.
- Formulaire de profil usager avec upload de pièces (max configurable, actuellement
  500 Mo observé) et listes en cascade Mouhafaza → Kaza → Commune chargées depuis l'API.
- Module de dépôt de documents lié au dossier et à la formalité en cours.

## Console de gestion (employés) — `/staff`
- Authentification MFA, scoping par service.
- Vue liste + calendrier des RDV (filtres : service, formalité, statut, date).
- Fiche usager : profil, historique, documents (prévisualisation), statut de dossier.
- Actions : changer statut, demander pièce complémentaire, ajouter note interne,
  notifier l'usager par email.
- Export CSV/Excel, journal d'audit des actions.

## Console de paramétrage (admin consulat) — `/admin`
- CRUD Services / Formalités / Documents requis / Taxes / Emails de contact.
- Gestion des règles de redirection par département.
- Gestion des divisions administratives (Mouhafaza/Kaza/Commune), import CSV.
- Mapping Calendly (Event Type URI par formalité), test de connexion API.
- Gestion des comptes employés et rôles (RBAC).
- Éditeur de contenu multilingue (bandeaux d'information, notes, mentions légales).
- Personnalisation de marque par entité (logo, couleurs) si multi-tenant.
- Tableau de bord : volumétrie de RDV, taux d'annulation, délai moyen de traitement.

## Intégration Calendly (détails techniques)
- OAuth2 côté admin pour connecter le compte Calendly du consulat.
- Au moment de la sauvegarde d'une Formality, proposer soit de créer un nouvel Event
  Type via l'API, soit de sélectionner un Event Type existant.
- Endpoint webhook `/api/webhooks/calendly` : vérifier la signature, traiter
  `invitee.created` (créer/mettre à jour `Appointment`), `invitee.canceled` (statut
  annulé), déclencher notification usager.
- Champs custom Calendly (nom, email, téléphone) pré-remplis depuis le profil `Applicant`.

## Sécurité & conformité
- RGPD : consentement explicite, durée de conservation configurable, export/suppression
  des données sur demande.
- Chiffrement des documents sensibles au repos (S3 SSE) et en transit (TLS).
- MFA obligatoire pour tous les comptes `staff`/`admin`.
- Accessibilité RGAA/WCAG 2.1 AA, responsive mobile-first.

## Étapes de développement suggérées
1. Setup projet (Next.js, Prisma, PostgreSQL, auth).
2. Modèle de données + seed à partir des fichiers `/content`.
3. Frontend public : accueil, wizard RDV, profil, documents.
4. Intégration Calendly (embed + webhooks).
5. Console employés.
6. Console admin/paramétrage.
7. i18n, accessibilité, tests, durcissement sécurité.

## Notes importantes
- Ne jamais coder en dur les listes de services/formalités/documents/emails : tout doit
  provenir de la base de données paramétrable, avec les fichiers `/content` utilisés
  uniquement comme seed initial.
- Certaines sections de contenu dans `/content` sont marquées `[À COMPLÉTER]` : prévoir
  que l'admin puisse les compléter directement depuis la console de paramétrage après
  mise en production.
