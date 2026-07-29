// Seed — peuple la base à partir des fichiers /content (données d'amorçage, rien de codé en dur côté front)
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const BANNER = `Dans le souci d'optimiser le traitement de vos demandes consulaires, et au vu du volume grandissant des appels téléphoniques reçus par l'Ambassade, nous vous invitons à privilégier le courrier électronique (email) comme moyen de contact pour vos formalités consulaires.\n\nMerci d'adresser vos courriers électroniques aux adresses mail dédiées aux services consulaires :\n- Service de l'état civil : etat.civil.consulat@ambassadeliban.fr\n- Service des passeports et des laissez-passer : passeport.consulat@ambassadeliban.fr\n- Service des légalisations et des traductions : leg.trad.consulat@ambassadeliban.fr\n- Service des visas : visa.consulat@ambassadeliban.fr\n- Service des procurations : procuration.consulat@ambassadeliban.fr\n- Pour toute autre question ou requête : info@ambassadeliban.fr\n\nCette démarche permet un traitement plus rapide, plus efficace, et une meilleure traçabilité de vos requêtes.`;

async function main() {
  // --- Entity ---
  const entity = await prisma.entity.create({
    data: {
      name: "Ambassade du Liban à Paris",
      tagline: "Portail e-services consulaires",
      primaryColor: "#006233",
      address: "3, Villa Copernic 75116 Paris",
      phone: "01.40.67.75.75",
      email: "info@ambassadeliban.fr",
      openingHours: "Ouverture au public de 8h30 à 14h30",
    },
  });

  // --- Règle de redirection départements → Marseille ---
  await prisma.departmentRedirectRule.create({
    data: {
      departments:
        "01,03,04,05,06,07,09,11,12,13,15,16,17,19,20,23,24,26,30,31,32,33,34,36,38,40,42,43,46,47,48,63,64,65,66,69,73,74,79,81,82,83,84,86,87",
      targetName: "Consulat Général à Marseille",
      message:
        "Les usagers résidant dans l'un des départements mentionnés sont invités à effectuer leurs démarches auprès du Consulat Général à Marseille. Les Rendez-Vous auprès des services consulaires de l'Ambassade du Liban à Paris ne sont pas accessibles aux usagers relevant de cette circonscription.",
      contactEmail: "consuliban.marseille@gmail.com",
    },
  });

  // --- Services ---
  // formUrl : formulaires PDF officiels servis depuis /public/formulaires
  // (téléchargeables « en haut de la page » du service, Requirements §04).
  const servicesData = [
    { slug: "passeport", name: "Passeport", icon: "book", order: 1, contactEmail: "passeport.consulat@ambassadeliban.fr" },
    { slug: "etat-civil", name: "Etat Civil", icon: "file-text", order: 2, contactEmail: "etat.civil.consulat@ambassadeliban.fr" },
    { slug: "visa", name: "Visa", icon: "stamp", order: 3, contactEmail: "visa.consulat@ambassadeliban.fr", formUrl: "/formulaires/formulaire-visa.pdf" },
    { slug: "legalisations-traductions", name: "Légalisations-Traductions", icon: "scroll", order: 4, contactEmail: "leg.trad.consulat@ambassadeliban.fr" },
    { slug: "procuration", name: "Procuration", icon: "pen-line", order: 5, contactEmail: "procuration.consulat@ambassadeliban.fr", formUrl: "/formulaires/formulaire-procuration.pdf" },
  ];
  const services = {};
  for (const s of servicesData) {
    services[s.slug] = await prisma.service.create({
      data: { ...s, entityId: entity.id, banner: BANNER },
    });
  }

  // --- Disponibilités par défaut (moteur de créneaux natif) ---
  // Ouverture au public 8h30–14h30 : créneaux du lundi au vendredi, 9h–14h.
  // RDV de 30 min, durée observée sur le Calendly historique (Requirements
  // §10) ; 2 guichets pour les passeports (service le plus demandé).
  // Le tout reste modifiable dans Admin → Disponibilités.
  for (const s of Object.values(services)) {
    for (let weekday = 1; weekday <= 5; weekday++) {
      await prisma.availabilityRule.create({
        data: {
          serviceId: s.id,
          weekday,
          startMinute: 9 * 60,
          endMinute: 14 * 60,
          slotMinutes: 30,
          capacity: s.slug === "passeport" ? 2 : 1,
        },
      });
    }
  }

  // --- Formalités ---
  const cal = "https://calendly.com/passeport-consulat/30min";
  const F = (serviceSlug, data) =>
    prisma.formality.create({ data: { ...data, serviceId: services[serviceSlug].id } });
  const docs = (formalityId, labels) =>
    Promise.all(
      labels.map((label, i) =>
        prisma.requiredDocument.create({ data: { formalityId, label, order: i + 1 } })
      )
    );

  // Passeport
  const p1 = await F("passeport", {
    slug: "nouveau-passeport-biometrique",
    name: "Demande d'un nouveau passeport biométrique",
    description: "Présence obligatoire. Photocopies du dossier en couleur. Rendez-vous obligatoire.",
    content:
      "NB : Présence obligatoire. Les photocopies du dossier en couleur DHL le jour du dépôt de dossier. Rendez-vous obligatoire.\n\n### Procédure en ligne (FastTrack DHL)\nAller sur https://fasttracklb.dhl.com → choisir Embassy or General Consulate → France → Embassy of Lebanon in Paris → Passeports for Lebanese expatriates → remplir le document → payer en ligne → envoyer le PDF (11 pages) à passeport.consulat@ambassadeliban.fr",
    emailContact: "passeport.consulat@ambassadeliban.fr",
    calendlyUrl: cal,
    order: 1,
  });
  const p2 = await F("passeport", {
    slug: "passeport-perdu-ou-vole",
    name: "Passeport perdu ou volé",
    description: "Laissez-passer pour adulte en cas de vol ou perte du passeport.",
    taxAmount: 27,
    taxMode: "espèces",
    taxDetail: "27€ pour 3 mois (non renouvelable), en espèces",
    emailContact: "passeport.consulat@ambassadeliban.fr",
    calendlyUrl: cal,
    order: 2,
  });
  await docs(p2.id, [
    "1 photocopie de la carte d'identité libanaise (nouveau format) ou de la fiche libanaise d'état civil",
    "Copie du procès-verbal de perte ou de vol émis par le commissariat de police",
    "1 photocopie du passeport perdu ou volé, si possible",
    "Billet d'avion direct (sans escale) de retour au Liban",
    "2 photos d'identité récentes sur fond blanc (3.5cm x 4.3cm)",
    "Taxe consulaire : 27€ pour 3 mois (non renouvelable), en espèces",
  ]);
  const p3 = await F("passeport", {
    slug: "titre-voyage-palestinien",
    name: "Demande d'un nouveau titre de voyage palestinien électronique ou biométrique",
    taxAmount: 176,
    taxMode: "virement ou espèces",
    taxDetail: "176€ pour un renouvellement de 5 ans, virement ou espèces",
    emailContact: "passeport.consulat@ambassadeliban.fr",
    calendlyUrl: cal,
    order: 3,
  });
  await docs(p3.id, [
    "Une fiche individuelle d'état civil émise après 2004 + 1 photocopie",
    "La carte d'identité des réfugiés palestiniens délivrée par le ministère de l'Intérieur libanais + 1 photocopie",
    "La carte UNRWA (pour les inscrits) + 1 photocopie",
    "La carte française de séjour + 1 photocopie",
    "Le titre de voyage actuel + deux photocopies des pages 1 à 5",
    "Un formulaire à remplir",
    "2 photos d'identité récentes sur fond blanc (3.5cm x 4.3cm)",
    "Taxe consulaire : 176€ pour un renouvellement de 5 ans, virement ou espèces",
  ]);
  // Laissez-passer nouveau-né (contenu rattaché au service passeport)
  const p4 = await F("passeport", {
    slug: "laissez-passer-nouveau-ne",
    name: "Demande d'un laissez-passer pour nouveau-né",
    taxAmount: 27,
    taxMode: "espèces",
    taxDetail: "27€ pour 1 an (non renouvelable), en espèces",
    emailContact: "passeport.consulat@ambassadeliban.fr",
    calendlyUrl: cal,
    order: 4,
  });
  await docs(p4.id, [
    "Acte de naissance français du nouveau-né : photocopie",
    "1 photocopie des passeports pour chacun des parents",
    "2 photos d'identité récentes sur fond blanc (3.5cm x 4.3cm)",
    "Demande présentée et signée au consulat par les deux parents, ou autorisation des parents légalisée par la mairie",
    "Taxe consulaire : 27€ pour 1 an (non renouvelable), en espèces",
  ]);

  // Etat Civil
  const ec = [
    ["enregistrement-mariage", "Enregistrement de mariage"],
    ["divorce-par-jugement", "Enregistrement de divorce par jugement"],
    ["divorce-consentement-mutuel", "Enregistrement de divorce par consentement mutuel"],
    ["enregistrement-deces", "Enregistrement de décès"],
    ["enregistrement-naissance", "Enregistrement de naissance"],
    ["naissance-hors-mariage", "Enregistrement de naissance hors mariage"],
    ["naissance-hors-mariage-pere-inconnu", "Enregistrement de naissance hors mariage d'un père inconnu"],
    ["laissez-passer-mortuaire", "Laissez-Passer Mortuaire (pour le Liban)"],
    ["nationalite-par-mariage", "Demande de nationalité libanaise par mariage"],
    ["recouvrement-nationalite", "Recouvrement de la nationalité libanaise"],
    ["correction-etat-civil", "Correction de l'état civil"],
    ["desistement-nationalite", "Désistement de la nationalité libanaise"],
  ];
  let ecOrder = 0;
  for (const [slug, name] of ec) {
    ecOrder++;
    const f = await F("etat-civil", {
      slug,
      name,
      emailContact: "etat.civil.consulat@ambassadeliban.fr",
      order: ecOrder,
      description: slug === "enregistrement-mariage" || slug === "divorce-par-jugement" ? null : "[À COMPLÉTER] Détail des pièces et taxes à renseigner depuis la console d'administration.",
    });
    if (slug === "enregistrement-mariage") {
      await docs(f.id, [
        "Photocopie de l'extrait d'état civil individuel libanais récent (بيان قيد إفرادي) des deux époux, ou fiches familiales d'état civil, ou cartes d'identité",
        "Copie du décret de francisation si le prénom et/ou le nom de l'un des époux a été francisé + 55€ de taxes consulaires",
        "Acte de Mariage - Copie Intégrale originale, délivré par la mairie + photocopie",
        "Si conjoint non libanais : acte de naissance original (traduit en français si non rédigé en arabe/français) + photocopie de sa carte d'identité ou passeport",
        "Formulaire à imprimer et remplir",
      ]);
    }
    if (slug === "divorce-par-jugement") {
      await docs(f.id, [
        "Photocopie de l'acte libanais de mariage (وثيقة زواج) et de la fiche familiale libanaise d'état civil (إخراج قيد عائلي)",
        "Copie du décret de francisation si applicable + 55€ de taxes consulaires",
        "Copie de la procuration établie à un avocat aux barreaux de Beyrouth ou de Tripoli, avec ses coordonnées",
      ]);
    }
  }

  // Visa
  const visas = [
    ["visa-touristique", "Demande de visa touristique"],
    ["visa-etudiant", "Demande de visa étudiant"],
    ["visa-professionnel", "Demande de visa professionnel"],
    ["visa-refugie", "Demande de visa réfugié"],
  ];
  let vOrder = 0;
  for (const [slug, name] of visas) {
    vOrder++;
    await F("visa", {
      slug,
      name,
      emailContact: "visa.consulat@ambassadeliban.fr",
      order: vOrder,
      description: "[À COMPLÉTER] Liste des pièces requises et taxes à renseigner depuis la console d'administration.",
    });
  }

  // Légalisations-Traductions
  const legs = [
    ["attestation-permis-de-conduire", "Attestation d'authenticité du permis de conduire"],
    ["permis-de-conduire", "Permis de conduire"],
    ["certificat-de-vie", "Certificat de vie"],
    ["certificat-de-scolarite", "Certificat de scolarité"],
    ["certificat-de-concordance", "Certificat de concordance"],
    ["certificats-celibat-coutume", "Certificats de célibat et de coutume"],
    ["certificats-coutume-notaire", "Certificats de coutume notaire"],
    ["certificat-actes", "Certificat de naissance, mariage, divorce, décès, nationalité"],
    ["autres-legalisations", "Autres légalisations"],
    ["apposition-empreintes", "Apposition d'empreintes"],
    ["legalisation-documents-commerciaux", "Légalisation de documents commerciaux"],
    ["legalisation-de-jugement", "Légalisation de jugement"],
    ["legalisations-traductions-actes-libanais", "Légalisations et traductions d'actes relatifs à l'état civil libanais"],
  ];
  let lOrder = 0;
  for (const [slug, name] of legs) {
    lOrder++;
    await F("legalisations-traductions", {
      slug,
      name,
      emailContact: "leg.trad.consulat@ambassadeliban.fr",
      order: lOrder,
      description: "[À COMPLÉTER] Détail des pièces requises et taxes à renseigner depuis la console d'administration.",
    });
  }

  // Procuration — liste complète relevée sur le portail d'origine (14 formalités)
  const procs = [
    ["procuration-generale", "Procuration générale"],
    ["procuration-generale-juridique", "Procuration générale juridique"],
    ["procuration-speciale-immobilier", "Procuration spéciale relative aux biens immobiliers et mobiliers"],
    ["procuration-speciale-juridique", "Procuration spéciale juridique"],
    ["procuration-speciale-divorce-mariage", "Procuration spéciale de divorce/mariage"],
    ["procuration-speciale-etat-civil-passeports", "Procuration spéciale relative à l'état civil libanais et aux passeports"],
    ["annulation-de-procuration", "Annulation de procuration"],
    ["desistement", "Désistement"],
    ["affidavit", "Affidavit"],
    ["engagement", "Engagement"],
    ["deni-de-propriete", "Déni de propriété (uniquement pour les non-Libanais)"],
    ["testament", "Testament"],
    ["autres-formalites-notariales", "Autres formalités notariales"],
    ["devolution-successorale", "Dévolution Successorale"],
  ];
  let prOrder = 0;
  for (const [slug, name] of procs) {
    prOrder++;
    await F("procuration", {
      slug,
      name,
      emailContact: "procuration.consulat@ambassadeliban.fr",
      order: prOrder,
      description: "[À COMPLÉTER] Détail des pièces requises et taxes à renseigner depuis la console d'administration.",
    });
  }

  // --- Divisions administratives du Liban ---
  const tree = {
    "Beyrouth": ["Beyrouth"],
    "Mont-Liban": ["Aley", "Baabda", "Chouf", "Jbeil", "Kesrouan", "Metn"],
    "Nord-Liban": ["Batroun", "Bcharré", "Koura", "Minieh-Denniye", "Tripoli", "Zgharta"],
    "Sud-Liban": ["Jezzine", "Sayda", "Tyr"],
    "Nabatieh": ["Bint-Jbeil", "Hasbaya", "Marjayoun", "Nabatieh"],
    "Bekaa": ["Baalbeck", "Békaa-Ouest", "Hermel", "Rachaya", "Zahlé"],
  };
  const sampleCommunes = {
    "Metn": ["Baskinta", "Beit Mery", "Bikfaya", "Jdeideh", "Antelias", "Dbayeh"],
    "Aley": ["Aramoun", "Aley", "Bhamdoun", "Souk El Gharb"],
    "Bint-Jbeil": ["Ain Ebel", "Bint-Jbeil", "Aitaroun"],
    "Nabatieh": ["Aaba", "Nabatieh", "Kfar Roummane"],
    "Beyrouth": ["Achrafieh", "Hamra", "Ras Beyrouth"],
    "Zahlé": ["Zahlé", "Chtaura"],
    "Tripoli": ["Tripoli", "El Mina"],
  };
  for (const [mouhafaza, kazas] of Object.entries(tree)) {
    const m = await prisma.adminDivision.create({ data: { level: 1, name: mouhafaza } });
    for (const kaza of kazas) {
      const k = await prisma.adminDivision.create({
        data: { level: 2, name: kaza, parentId: m.id },
      });
      for (const commune of sampleCommunes[kaza] ?? []) {
        await prisma.adminDivision.create({
          data: { level: 3, name: commune, parentId: k.id },
        });
      }
    }
  }

  // --- Blocs de contenu éditorial ---
  const blocks = [
    { key: "home.tile.rdv", title: "PRENDRE RENDEZ-VOUS", body: "Choisissez votre formalité, un créneau, et repartez avec une confirmation immédiate — sans créer de compte." },
    { key: "home.tile.gestion", title: "GÉRER MON RENDEZ-VOUS", body: "Retrouvez, déplacez ou annulez votre rendez-vous avec votre référence et votre email." },
    { key: "home.tile.profile", title: "MON ESPACE (OPTIONNEL)", body: "Créez un espace pour retrouver vos rendez-vous passés et à venir et pré-remplir vos démarches." },
    { key: "rdv.intro.steps", title: "Étapes de prise de rendez-vous", body: "1. Sélectionnez le service consulaire concerné.\n2. Choisissez la formalité : la liste des pièces à fournir s'affiche avant toute réservation.\n3. Choisissez un créneau et confirmez : votre rendez-vous n'est enregistré qu'après l'écran de confirmation, qui récapitule adresse, durée, pièces et référence." },
    { key: "rdv.banner", title: "Privilégiez l'email", body: BANNER },
    // Message historique du Calendly de l'ambassade (Requirements §10),
    // affiché sur l'écran de confirmation du rendez-vous.
    {
      key: "rdv.confirmation.note",
      title: "Consigne de présentation",
      body: "Merci de vous présenter à l'heure exacte de votre rendez-vous, muni de tous les documents nécessaires ainsi que du montant de la taxe consulaire en espèces.",
    },
  ];
  for (const b of blocks) {
    await prisma.contentBlock.create({ data: b });
  }

  // --- Utilisateurs staff/admin (démo) ---
  const hash = (pwd) => bcrypt.hashSync(pwd, 10);
  await prisma.user.create({
    data: { email: "admin@ambassadeliban.fr", name: "Administrateur", passwordHash: hash("Admin123!"), role: "ADMIN", entityId: entity.id },
  });
  await prisma.user.create({
    data: { email: "superviseur@ambassadeliban.fr", name: "Superviseur Consulaire", passwordHash: hash("Super123!"), role: "SUPERVISOR", entityId: entity.id },
  });
  await prisma.user.create({
    data: {
      email: "agent.passeport@ambassadeliban.fr",
      name: "Agent Passeport",
      passwordHash: hash("Agent123!"),
      role: "AGENT",
      entityId: entity.id,
      serviceIds: JSON.stringify([services["passeport"].id]),
    },
  });

  console.log("✅ Seed terminé :", entity.name);
  console.log("   Comptes démo — admin@ambassadeliban.fr / Admin123! · superviseur@ambassadeliban.fr / Super123! · agent.passeport@ambassadeliban.fr / Agent123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
