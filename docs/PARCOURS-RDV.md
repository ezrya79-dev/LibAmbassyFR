# Parcours de prise de rendez-vous — analyse et refonte

## 1. Le parcours d'origine, et pourquoi il posait problème

Le parcours initial reposait sur un embed Calendly en iframe à la dernière étape :

```
Accueil → Service → Formalité (pièces + iframe Calendly) → réservation DANS l'iframe
```

Problèmes constatés :

| Problème | Cause |
|---|---|
| **« Les gens ne comprennent pas que le RDV n'est pas encore enregistré »** | La réservation se fait *dans* l'iframe Calendly. Le portail autour ne change pas d'état : aucun écran du portail ne dit « c'est fait ». La confirmation Calendly (dans l'iframe, en anglais parfois) n'a pas l'apparence officielle de l'ambassade. |
| Adresse et durée affichées **avant** la fin du parcours | L'information de synthèse était dispersée en amont, puis absente au moment où l'usager en a besoin (à la confirmation). |
| Le portail pouvait **ignorer** des RDV réellement pris | Le portail n'apprend l'existence d'un RDV que par webhook Calendly signé. Sans configuration OAuth + webhook + clé de signature (3 secrets à gérer), la console employés reste vide alors que Calendly a bien enregistré le RDV. |
| Dépendance architecturale forte | Un compte Calendly payant par employé/service, des URLs d'event types à maintenir dans l'admin, des données personnelles d'usagers transitant par un tiers américain (RGPD), aucun contrôle sur l'apparence ni la langue (FR/AR). |

## 2. Le parcours cible (implémenté)

Décision : **moteur de créneaux natif**, Calendly sort du parcours usager.
La réservation, la confirmation et la gestion se font entièrement dans le portail.

```
Accueil
  └─ Prendre RDV
       1. Département de résidence  (redirection Marseille le cas échéant)
       2. Service                    (Passeport, État civil, …)
       3. Formalité                  → pièces à fournir affichées AVANT le calendrier
       4. Créneau                    (calendrier natif, bandeau « pas encore réservé »)
       5. Coordonnées                (prénom, nom, email, téléphone — SANS compte)
       6. ✅ CONFIRMATION            ← tout est ici, à la FIN :
            date · durée · adresse · horaires · pièces à apporter ·
            taxe · référence LB-XXXXXX · export .ics · lien de gestion
```

Principes appliqués :

- **Le moment d'engagement est explicite.** Un bandeau au-dessus du calendrier
  annonce que rien n'est réservé avant confirmation ; l'écran final vert avec
  référence est la seule « preuve » — il n'y a plus d'ambiguïté possible.
- **Tout le récapitulatif est à la fin** (adresse, durée, pièces, taxe),
  conformément au besoin exprimé.
- **Aucun compte requis.** Email + référence suffisent pour retrouver,
  déplacer ou annuler son RDV (`/rdv/gestion`). L'espace personnel (OTP email)
  reste disponible en option : il liste les RDV passés et à venir, rattachés
  automatiquement par email.
- **Pas de dépôt de documents dans ce lot.** Le module existe toujours en code
  (`/documents`) mais n'est plus proposé dans le parcours.

## 3. Gestion du calendrier côté ambassade

Console **Admin → Disponibilités** :

- une règle par plage hebdomadaire et par service : jour, heures, durée du
  rendez-vous, nombre de guichets en parallèle (capacité) ;
- fermetures exceptionnelles (jour férié, congés) globales ou par service ;
- effet immédiat sur le calendrier public — c'est le « changement calendrier
  efficace » demandé : ouvrir un samedi ou doubler les guichets passeport se
  fait en une ligne, sans toucher à Calendly.

Garanties du moteur :

- créneaux générés en **heure de Paris** (stockage UTC, insensible au fuseau du serveur) ;
- fenêtre de réservation : de +2 h à +60 jours ;
- **anti double-réservation** : revérification de la capacité dans une
  transaction — le deuxième usager sur un même dernier créneau est refusé avec
  un message clair et renvoyé au calendrier ;
- l'annulation libère immédiatement le créneau.

## 4. Et Calendly ?

L'intégration (OAuth, webhook signé, page admin) est **conservée mais
optionnelle** — hors du parcours usager. Si un service souhaite continuer à
gérer son agenda dans Calendly pendant une transition, les webhooks alimentent
toujours la console staff. Recommandation : la retirer complètement une fois
la bascule validée (lot de nettoyage).

## 5. Lots suivants (non inclus, par ordre de valeur)

1. **Emails transactionnels (SMTP)** : confirmation, rappel J-1, annulation.
   Aujourd'hui l'OTP et la confirmation sont à l'écran uniquement.
2. **Dépôt de pièces en amont du RDV** : réactiver `/documents` dans le
   parcours, avec pré-contrôle par les agents (le code existe).
3. **Capacité fine par formalité** (durées différentes par formalité,
   aujourd'hui uniformes par service).
4. **File d'attente / surbooking contrôlé**, statistiques de no-show.
5. **Suppression définitive de Calendly** si la transition est concluante.

## 6. Couverture de test

Parcours vérifié en navigateur réel (Playwright/Chromium, 20 vérifications) :
réservation complète, écran final (adresse/durée/pièces/référence), export ICS,
confirmation inaccessible sans jeton, gestion par référence + email,
déplacement, annulation, re-disponibilité du créneau, espace usager OTP,
et test de concurrence sur le dernier créneau d'un service à capacité 1.
