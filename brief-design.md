# Brief UI/UX — Portail e-services consulaires (Ambassade du Liban à Paris)

## 1. Le projet en 3 phrases

Refonte complète du portail e-services de l'Ambassade du Liban à Paris (aujourd'hui sur InvestGlass).
Le site permet aux ressortissants libanais de France de **prendre rendez-vous** pour une démarche
consulaire (passeport, état civil, visa, légalisations, procurations), de **gérer leur profil** et
de **déposer leurs documents** en ligne. Le projet comprend aussi **deux back-offices** : un pour
les employés du consulat (traitement des RDV et dossiers) et un pour l'administrateur (paramétrage
de tout le contenu).

## 2. Les 3 surfaces à designer

### A. Site public (usagers) — priorité 1
Public : Libanais résidant en France, tous âges, pas nécessairement à l'aise avec le numérique.
Ton attendu : **institutionnel, rassurant, sobre** (site d'ambassade), très lisible, accessible.

| Écran | Contenu |
|---|---|
| Accueil | En-tête (emblème Liban + nom), 3 grandes tuiles : **Prise de RDV**, **Modifiez votre profil**, **Attachez vos documents** ; pied de page avec coordonnées de l'ambassade |
| RDV étape 1 | Saisie du département de résidence → si département rattaché à Marseille : **écran de blocage** avec message + email du consulat de Marseille. Sinon : liste des 5 services (Passeport, État Civil, Visa, Légalisations-Traductions, Procuration) |
| RDV étape 2 | Liste des formalités du service choisi (cartes numérotées) + **bandeau informatif** (privilégier l'email, liste des adresses par service) |
| RDV étape 3 | Détail d'une formalité : pièces requises (checklist), taxe consulaire, email de contact, puis **calendrier de réservation intégré** (widget Calendly embed, pas de redirection externe) |
| Connexion usager | Email → code à 6 chiffres (OTP). Pas de mot de passe |
| Profil usager | Formulaire en 4 sections : infos générales (prénom, nom, naissance, email, téléphone) / nationalités (jusqu'à 3 + pièce jointe) / adresse France / adresse Liban avec **listes en cascade Mouhafaza → Kaza → Commune** |
| Mes documents | Upload de fichiers (glisser-déposer, max 500 Mo), liste des documents déposés avec **statut** (reçu / validé / rejeté / pièce demandée) |

### B. Console employés `/staff` — priorité 2
Usage interne quotidien : efficacité > esthétique. Dense, filtrable, orienté tâches.

| Écran | Contenu |
|---|---|
| Login | Email + mot de passe + champ code MFA |
| Tableau des RDV | Compteurs par statut (planifié / honoré / annulé / absent), filtres service/statut, tableau (date, usager, service/formalité, statut), export CSV |
| Fiche usager | Profil complet, historique RDV avec changement de statut, documents avec prévisualisation et validation, notes internes (timeline), bouton « demander une pièce complémentaire » |

### C. Console admin `/admin` — priorité 3
Paramétrage complet : services, formalités, pièces requises, taxes, emails, règles de redirection
par département, divisions administratives du Liban (import CSV), mapping Calendly, comptes
employés (rôles + MFA), éditeur de contenu, couleurs/logo, tableau de bord (volumétrie RDV,
taux d'annulation, délai moyen) et journal d'audit.

## 3. Identité visuelle

- **Couleurs du drapeau libanais** : vert cèdre `#006233` (primaire, actuel), rouge `#EE161F` (accent, à utiliser avec parcimonie), blanc
- **Symbole** : le cèdre du Liban (SVG déjà présent, à raffiner éventuellement)
- Ambiance : institutionnelle et épurée — penser « service public premium », pas « startup »
- Police : sans-serif système lisible ; prévoir une **police arabe** correcte (Noto Sans Arabic ou équivalent)

## 4. Contraintes techniques à respecter

- **Responsive mobile-first** : beaucoup d'usagers sur smartphone
- **Trilingue FR / EN / AR** : l'arabe impose un **layout RTL** (miroir complet) — prévoir les maquettes dans les deux sens
- **Accessibilité RGAA/WCAG 2.1 AA** : contrastes, focus visibles, tailles de touch ≥ 44 px
- Implémentation en **Tailwind CSS** : livrer idéalement des maquettes Figma avec tokens (couleurs, espacements, rayons) transposables en classes Tailwind
- Les statuts ont des couleurs sémantiques : bleu = planifié/reçu, vert = validé/honoré, rouge = rejeté/annulé, ambre = action requise

## 5. Parcours clé à soigner (le plus important)

**Prise de RDV en 3 étapes** : choix du service → choix de la formalité → calendrier.
Il doit être évident, rassurant, avec fil d'Ariane « Étape 1/3 », possibilité de revenir en
arrière, et un récapitulatif des pièces à apporter **avant** de choisir son créneau (l'usager
doit savoir quoi préparer et combien ça coûte avant de réserver).

## 6. Références du contenu réel

- Le texte exact des services/formalités/pièces se trouve dans `content/*.md` du repo
- Version de travail en ligne : https://alfpr.joefr.cloud (fonctionnelle mais UI basique à remplacer)
