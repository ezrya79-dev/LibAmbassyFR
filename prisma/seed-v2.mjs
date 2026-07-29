// Seed v2 — contenu COMPLET extrait de "info Prise de RDV.docx" (idempotent)
// Met à jour formalités + pièces requises + taxes, ajoute les disponibilités par défaut.
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// [serviceSlug, slug, nom, ordre, taxe (détail affiché), [pièces]]
const DATA = [
  // ============ ETAT CIVIL ============
  ["etat-civil", "enregistrement-mariage", "Enregistrement de mariage", 1, null, [
    "Photocopie de l'extrait d'état civil individuel libanais récent (بيان قيد إفرادي) des deux époux, ou de leurs fiches familiales d'état civil, ou de leurs cartes d'identité",
    "Copie du décret de francisation si le prénom et/ou le nom de l'un des époux a été francisé (lors de la naturalisation) + 55€ de taxes consulaires",
    "Acte de Mariage - Copie Intégrale originale, délivré par la mairie + photocopie",
    "Si l'un des conjoints est non libanais : acte de naissance original (traduit en français si non rédigé en arabe/français) + photocopie de sa carte d'identité ou passeport",
    "Formulaire « Etat Civil » à imprimer et remplir (téléchargeable en haut de page)",
  ]],
  ["etat-civil", "divorce-par-jugement", "Enregistrement de divorce par jugement", 2, "Taxe de légalisation du jugement : 55€ · Taxe : 2/1000 des montants figurant dans le dispositif du jugement · 36€ par page de légalisation de la traduction", [
    "Photocopie de l'acte libanais de mariage (وثيقة زواج) et de la fiche familiale libanaise d'état civil (إخراج قيد عائلي)",
    "Copie du décret de francisation si applicable + 55€ de taxes consulaires",
    "Copie de la procuration établie à un avocat aux barreaux de Beyrouth ou de Tripoli, avec ses coordonnées",
    "Expédition exécutoire du jugement de divorce originale (ou copie conforme revêtue de la formule exécutoire), délivrée par le Greffe du Tribunal + photocopie",
    "Traduction en arabe par un traducteur assermenté + photocopie",
    "Légalisation du jugement et de sa traduction (si traduction faite en France) via apostille.notaires.fr",
    "Formulaire « Etat Civil » à imprimer et remplir",
  ]],
  ["etat-civil", "divorce-consentement-mutuel", "Enregistrement de divorce par consentement mutuel", 3, null, [
    "Nous contacter par email pour la liste des pièces : etat.civil.consulat@ambassadeliban.fr",
  ]],
  ["etat-civil", "enregistrement-deces", "Enregistrement de décès", 4, null, [
    "Photocopie de la carte d'identité libanaise, de la fiche individuelle (بيان قيد إفرادي) ou de la fiche familiale d'état civil (بيان قيد عائلي) portant le nom du défunt",
    "Copie du décret de francisation si applicable + 55€ de taxes consulaires",
    "Acte de décès - Copie Intégrale originale délivrée par la mairie + photocopie",
    "Formulaire « Etat Civil » à imprimer et remplir",
  ]],
  ["etat-civil", "enregistrement-naissance", "Enregistrement de naissance", 5, null, [
    "Photocopie de l'acte libanais de mariage (وثيقة زواج) des parents ou de la fiche familiale d'état civil (بيان قيد عائلي) portant le nom des deux parents (si le mariage n'est pas encore inscrit, il faut d'abord l'enregistrer)",
    "Si la mère a obtenu la nationalité libanaise par mariage : copie de sa carte d'identité ou de sa fiche individuelle d'état civil",
    "Copie du décret de francisation si applicable + 55€ de taxes consulaires",
    "Acte de naissance - Copie Intégrale de l'enfant, délivré par la mairie de naissance + photocopie",
    "Formulaire « Etat Civil » à imprimer et remplir",
  ]],
  ["etat-civil", "naissance-hors-mariage", "Enregistrement de naissance hors mariage", 6, "55€", [
    "Photocopie de la fiche d'état civil familiale (إخراج قيد عائلي) du père",
    "Photocopie de la carte d'identité libanaise (بطاقة هوية) ou de la fiche individuelle d'état civil (بيان قيد فردي) du père",
    "Copie du décret de francisation si applicable + 55€ de taxes consulaires",
    "Photocopie de la fiche d'état civil (بيان قيد إفرادي) de la mère ou de sa carte d'identité (بطاقة هوية)",
    "Photocopie des passeports ou cartes d'identité des deux témoins, dont la présence est impérative le jour du RDV",
    "Acte de naissance - Copie Intégrale originale de l'enfant, délivré par la mairie de naissance + photocopie",
    "Formulaire « Etat Civil » à imprimer et remplir",
  ]],
  ["etat-civil", "naissance-hors-mariage-pere-inconnu", "Enregistrement de naissance hors mariage d'un père inconnu", 7, "55€", [
    "Photocopie de la carte d'identité libanaise (بطاقة هوية) ou de la fiche individuelle d'état civil de la mère (إخراج قيد فردي)",
    "Copie du décret de francisation si applicable + 55€ de taxes consulaires",
    "Photocopie des passeports ou cartes d'identité des deux témoins, dont la présence est impérative le jour du RDV",
    "Acte de naissance de l'enfant - Copie Intégrale originale délivrée par la mairie de la commune de naissance",
    "Formulaire « Etat Civil » à imprimer et remplir",
  ]],
  ["etat-civil", "laissez-passer-mortuaire", "Laissez-Passer Mortuaire (pour le Liban)", 8, "44€", [
    "Acte de décès délivré par la mairie",
    "Certificat médical mentionnant que le décès n'est pas dû à une maladie contagieuse",
    "Certificat de non-épidémie délivré par l'Agence régionale de santé (ARS)",
    "Procès-verbal de soins de conservation du corps",
    "Procès-verbal de mise en bière",
    "Autorisation de fermeture du cercueil",
    "Laissez-passer mortuaire français",
    "Passeport libanais",
    "Formulaire « Etat Civil » à imprimer et remplir",
  ]],
  ["etat-civil", "nationalite-par-mariage", "Demande de nationalité libanaise par mariage", 9, "44€", [
    "Photocopie de la carte d'identité de l'intéressée portant le nom du conjoint libanais",
    "Photocopie des pages d'état civil du passeport de l'intéressée (portant le nom de l'époux) ainsi que de la page de validité",
    "Certificat de domicile précisant que les époux habitent ensemble, ou toute preuve de vie commune (taxe d'habitation, fiche d'imposition, quittance EDF…)",
    "Photocopie de l'acte libanais de mariage légalisé par le ministère libanais des Affaires étrangères (وثيقة زواج لبنانية مصدقة)",
    "Photocopie de la fiche familiale libanaise d'état civil légalisée par le ministère libanais des Affaires étrangères (بيان قيد عائلي مصدق)",
    "Demande de nationalité libanaise manuscrite sur papier libre",
    "Certificat de travail si l'intéressée exerce une activité professionnelle",
    "Deux actes de naissance originaux délivrés par la mairie de naissance",
    "Deux photos récentes de l'intéressée (ne rien noter au verso)",
    "Une enveloppe affranchie au tarif en vigueur, libellée à vos nom et adresse",
    "Autorisation manuscrite du mari rédigée en arabe sur papier libre",
    "Formulaire « Etat Civil » à imprimer et remplir",
  ]],
  ["etat-civil", "recouvrement-nationalite", "Recouvrement de la nationalité libanaise", 10, null, [
    "Veuillez contacter le service de l'état civil au 01 40 67 75 75",
  ]],
  ["etat-civil", "correction-etat-civil", "Correction de l'état civil", 11, null, [
    "Veuillez contacter le service de l'état civil au 01 40 67 75 75",
  ]],
  ["etat-civil", "desistement-nationalite", "Désistement de la nationalité libanaise", 12, null, [
    "Veuillez contacter le service de l'état civil au 01 40 67 75 75",
  ]],

  // ============ VISA ============
  ["visa", "visa-touristique", "Demande de visa touristique", 1, "77€ une entrée · 110€ deux entrées · 154€ entrées multiples", [
    "Attestation de réservation d'hôtel à votre nom aux dates du séjour, ou lettre d'invitation et d'hébergement (avec téléphone + copie de la carte d'identité de l'hébergeant libanais, ou de son permis de séjour au Liban valable ≥ 3 mois)",
    "Justificatif de domicile récent (quittance de loyer, dernière facture EDF/GDF…)",
    "Attestation de réservation provisoire d'un billet d'avion aux dates du séjour (arrivée et départ)",
    "Justificatif de ressources : 3 dernières fiches de paie ou 3 derniers relevés bancaires",
    "Visite familiale : documents prouvant la parenté (acte de naissance, acte de mariage…)",
    "Séjour médical : rapport médical précisant la durée du séjour + preuve de RDV avec le médecin traitant au Liban",
    "Mineurs : demande présentée et signée par les deux parents en présentiel, ou lettre signée et légalisée par la mairie + copie du livret de famille",
    "Original + photocopie couleur du passeport (validité ≥ 6 mois, sans mention de visite en Israël sous peine de refus d'entrée)",
    "Original + photocopie couleur du titre de séjour si résident étranger (validité ≥ 6 mois)",
    "Formulaire Visa rempli en lettres majuscules (un exemplaire par passeport)",
    "Une photo d'identité récente",
    "Attestation d'assurance couvrant la durée du séjour",
  ]],
  ["visa", "visa-etudiant", "Demande de visa étudiant", 2, "77€ une entrée · 110€ deux entrées · 154€ entrées multiples", [
    "Attestation de réservation d'hôtel ou lettre d'invitation et d'hébergement (mêmes conditions que le visa touristique)",
    "Justificatif de domicile récent",
    "Attestation de réservation provisoire d'un billet d'avion aux dates du séjour",
    "Justificatif de ressources : 3 dernières fiches de paie ou 3 derniers relevés bancaires",
    "Lettre d'invitation ou d'admission d'un établissement scolaire/universitaire libanais reconnu par l'État + justificatifs des moyens de subsistance (transferts bancaires, prise en charge, attestation de bourse…)",
    "Original + photocopie couleur du passeport (validité ≥ 6 mois, sans mention de visite en Israël)",
    "Original + photocopie couleur du titre de séjour si résident étranger (validité ≥ 6 mois)",
    "Formulaire Visa rempli en lettres majuscules (un exemplaire par passeport)",
    "Une photo d'identité récente",
    "Attestation d'assurance couvrant la durée du séjour",
  ]],
  ["visa", "visa-professionnel", "Demande de visa professionnel", 3, "77€ une entrée · 110€ deux entrées · 154€ entrées multiples", [
    "Attestation de réservation d'hôtel ou lettre d'invitation et d'hébergement (mêmes conditions que le visa touristique)",
    "Justificatif de domicile récent",
    "Passeport diplomatique/de service : note verbale du ministère des Affaires étrangères et européennes",
    "Passeport ordinaire : lettre de mission de votre société (ou de la société d'accueil au Liban) précisant coordonnées, durée, motif, prise en charge, nombre d'entrées et dates + copie du contrat de travail ou attestation/programme de stage",
    "Certificat d'immatriculation de la société au Registre du Commerce libanais",
    "Original + photocopie couleur du passeport (validité ≥ 6 mois, sans mention de visite en Israël)",
    "Original + photocopie couleur du titre de séjour si résident étranger (validité ≥ 6 mois)",
    "Formulaire Visa rempli en lettres majuscules (un exemplaire par passeport)",
    "Une photo d'identité récente",
    "Attestation d'assurance couvrant la durée du séjour",
  ]],
  ["visa", "visa-refugie", "Demande de visa réfugié", 4, "77€ une entrée · 110€ deux entrées · 154€ entrées multiples", [
    "Attestation de réservation d'hôtel ou lettre d'invitation et d'hébergement (mêmes conditions que le visa touristique)",
    "Justificatif de domicile récent",
    "Attestation de réservation provisoire d'un billet d'avion aux dates du séjour",
    "Justificatif de ressources : 3 dernières fiches de paie ou 3 derniers relevés bancaires",
    "Visite familiale : documents prouvant la parenté",
    "Séjour médical : rapport médical + preuve de RDV avec le médecin traitant au Liban",
    "Mineurs : demande signée par les deux parents en présentiel, ou lettre légalisée par la mairie + copie du livret de famille",
    "Original + photocopie couleur du passeport (validité ≥ 6 mois, sans mention de visite en Israël)",
    "Original + photocopie couleur du titre de séjour si résident étranger (validité ≥ 6 mois)",
    "Formulaire Visa rempli en lettres majuscules (un exemplaire par passeport)",
    "Une photo d'identité récente",
    "Attestation d'assurance couvrant la durée du séjour",
  ]],

  // ============ LEGALISATIONS-TRADUCTIONS ============
  ["legalisations-traductions", "attestation-permis-de-conduire", "Attestation d'authenticité du permis de conduire", 1, "53€", [
    "Photocopie du passeport libanais",
    "Photocopie du permis de conduire",
    "Attestation de la direction de la circulation routière libanaise (دائرة السوق), légalisée par le ministère des Affaires étrangères et des Émigrés, datant de moins de 3 mois + photocopie",
  ]],
  ["legalisations-traductions", "permis-de-conduire", "Traduction du permis de conduire libanais", 2, "71€", [
    "Photocopie du passeport libanais",
    "L'original du permis de conduire",
  ]],
  ["legalisations-traductions", "certificat-de-vie", "Certificat de vie émis par l'Ambassade", 3, "36€", [
    "L'original de tout document d'état civil libanais ou passeport libanais + photocopie",
  ]],
  ["legalisations-traductions", "certificat-de-scolarite", "Certificat de scolarité", 4, "53€ si binational · gratuit (1 document/an) si uniquement nationalité libanaise et moins de 25 ans", [
    "Photocopie du passeport libanais",
    "Photocopie de la carte de séjour",
    "Carte étudiant si uniquement détenteur de la nationalité libanaise",
    "Attestation scolaire ou universitaire (bulletin, notes…) légalisée via apostille.notaires.fr + photocopie",
  ]],
  ["legalisations-traductions", "certificat-de-concordance", "Certificat de concordance", 5, "53€", [
    "Photocopie de tout document libanais d'état civil en votre possession",
    "Photocopie du passeport libanais",
  ]],
  ["legalisations-traductions", "certificats-celibat-coutume", "Certificats de célibat et de coutume", 6, "53€ par certificat", [
    "Photocopie du passeport libanais",
    "Extrait d'état civil individuel ou fiche familiale datant de moins de 3 mois, légalisé par le ministère libanais de l'Intérieur et des Affaires étrangères + photocopie",
  ]],
  ["legalisations-traductions", "certificats-coutume-notaire", "Certificats de coutume notaire", 7, "53€", [
    "Photocopie du passeport libanais",
    "L'original de tout document d'état civil libanais ou passeport libanais + photocopie",
  ]],
  ["legalisations-traductions", "certificat-actes", "Certificat de naissance, mariage, divorce, décès, nationalité", 8, "53€ par certificat", [
    "Photocopie du passeport libanais",
    "L'original du document d'état civil libanais + photocopie",
  ]],
  ["legalisations-traductions", "autres-legalisations", "Autres légalisations", 9, "53€ document français · 18€ document libanais", [
    "Photocopie du passeport",
    "Document à certifier : légalisé via apostille.notaires.fr s'il émane des autorités françaises, ou par le ministère libanais des Affaires étrangères s'il émane du Liban + photocopie",
  ]],
  ["legalisations-traductions", "apposition-empreintes", "Apposition d'empreintes", 10, "53€", [
    "Photocopie du passeport libanais",
  ]],
  ["legalisations-traductions", "legalisation-documents-commerciaux", "Légalisation de documents commerciaux", 11, null, [
    "Contacter le service des légalisations commerciales : joanna.mahfouz@ambassadeliban.fr",
  ]],
  ["legalisations-traductions", "legalisation-de-jugement", "Légalisation de jugement", 12, "Commercial : 198€ (+ 4/1000 du montant, plafond 2750€) · État civil : 55€ (+ 1/1000, plafond 2200€)", [
    "Photocopie du passeport libanais (si Libanais)",
    "L'original du jugement",
    "Jugement commercial : légalisé par le tribunal de commerce + via apostille.notaires.fr",
    "Jugement relatif à l'état civil : légalisé via apostille.notaires.fr",
  ]],
  ["legalisations-traductions", "legalisations-traductions-actes-libanais", "Légalisations et traductions d'actes relatifs à l'état civil libanais", 13, "18€ par légalisation · 71€ par traduction", [
    "Photocopie du passeport libanais",
    "Original de l'acte en question, légalisé par le ministère libanais des Affaires étrangères et des Émigrés + photocopie",
  ]],
];

// Procurations : notes communes au service
const PROC_CONTENT = "NB : Toute personne âgée de 80 ans et plus voulant signer un acte notarial doit fournir un certificat médical récent attestant de la pleine possession de ses facultés intellectuelles et cognitives.\nNB : Le jour de votre RDV, vous devez IMPÉRATIVEMENT avoir sur vous la liste complète des documents requis IMPRIMÉS.\nNB : Pour tout texte de procuration personnalisé, veuillez le fournir au format WORD.\nFormulaire « Procuration » à télécharger en haut de page.";

const PROC_DOCS_BASE = [
  "Photocopie de la carte d'identité libanaise, extrait individuel ou familial d'état civil, ou passeport libanais du mandataire",
];
const PROC_MANDANT = "L'original + photocopie du passeport libanais en cours de validité pour le mandant, ou extrait individuel d'état civil ou carte d'identité libanaise";
const PROC_TIERS = "Pour établir une procuration au nom d'une tierce personne : l'original (ou copie conforme légalisée) de la procuration légalisée par le ministère libanais des Affaires étrangères et des Émigrés donnant pouvoir d'établir une procuration";

const PROC_DATA = [
  ["procuration-generale", "Procuration générale", 1, "88€ par procuration et par mandant", [...PROC_DOCS_BASE, PROC_MANDANT, PROC_TIERS]],
  ["procuration-generale-juridique", "Procuration générale juridique", 2, "88€ par procuration et par mandant", [...PROC_DOCS_BASE, PROC_MANDANT, PROC_TIERS]],
  ["procuration-speciale-immobilier", "Procuration spéciale relative aux biens immobiliers et mobiliers", 3, "44€ par procuration et par mandant", [...PROC_DOCS_BASE, "Photocopie du titre de propriété", "Photocopie de la carte grise (pour une vente ou un achat de voiture)", "Photocopie de tout document libanais d'état civil en cours de validité pour le mandant", PROC_TIERS]],
  ["procuration-speciale-juridique", "Procuration spéciale juridique", 4, "44€ par procuration et par mandant", [...PROC_DOCS_BASE, "Photocopie du titre de propriété (si biens immobiliers)", PROC_MANDANT, PROC_TIERS]],
  ["procuration-speciale-divorce-mariage", "Procuration spéciale de divorce/mariage", 5, "44€ par procuration et par mandant", [...PROC_DOCS_BASE, "Photocopie de la fiche familiale libanaise d'état civil ou de l'acte de mariage libanais", PROC_MANDANT, PROC_TIERS]],
  ["procuration-speciale-etat-civil-passeports", "Procuration spéciale relative à l'état civil libanais et aux passeports", 6, "44€ par procuration et par mandant", [...PROC_DOCS_BASE, PROC_MANDANT, PROC_TIERS]],
  ["annulation-de-procuration", "Annulation de procuration", 7, "66€ par procuration et par mandant", [...PROC_DOCS_BASE, "Photocopie de la procuration à annuler", "Coordonnées du mandataire notées sur un papier", PROC_MANDANT]],
  ["desistement", "Désistement", 8, "66€ par procuration et par mandant", [...PROC_DOCS_BASE, "Photocopie du titre de propriété (si biens immobiliers)", PROC_MANDANT]],
  ["affidavit", "Affidavit", 9, "66€ par procuration et par mandant", [...PROC_DOCS_BASE, "Photocopie du titre de propriété (si biens immobiliers)", PROC_MANDANT]],
  ["engagement", "Engagement", 10, "110€ par signataire", [...PROC_DOCS_BASE, PROC_MANDANT, "Rédaction de l'engagement"]],
  ["deni-de-propriete", "Déni de propriété (uniquement pour les non-Libanais)", 11, "110€ par signataire", ["Photocopie du titre de propriété ou de l'attestation foncière relatifs au bien à acquérir", "L'original + photocopie du passeport ou de la carte d'identité"]],
  ["testament", "Testament", 12, "110€ par procuration et par mandant", [...PROC_DOCS_BASE, PROC_MANDANT, "Dépôt : testament rédigé, à déposer le jour du RDV dans une enveloppe fermée", "Retrait : être accompagné de 2 témoins munis de leurs pièces d'identité"]],
  ["autres-formalites-notariales", "Autres formalités notariales", 13, "Variable selon la formalité", [...PROC_DOCS_BASE, PROC_MANDANT, PROC_TIERS]],
  ["devolution-successorale", "Dévolution successorale", 14, null, ["Nous contacter par email : procuration.consulat@ambassadeliban.fr"]],
];

async function upsertFormality(serviceId, emailContact, slug, name, order, taxDetail, docs, extra = {}) {
  const existing = await prisma.formality.findUnique({
    where: { serviceId_slug: { serviceId, slug } },
  });
  const data = {
    name, order, taxDetail, emailContact, active: true,
    description: null, // plus de "[À COMPLÉTER]"
    ...extra,
  };
  const f = existing
    ? await prisma.formality.update({ where: { id: existing.id }, data })
    : await prisma.formality.create({ data: { ...data, serviceId, slug } });
  await prisma.requiredDocument.deleteMany({ where: { formalityId: f.id } });
  for (let i = 0; i < docs.length; i++) {
    await prisma.requiredDocument.create({ data: { formalityId: f.id, label: docs[i], order: i + 1 } });
  }
  return f;
}

async function main() {
  const services = await prisma.service.findMany();
  const svc = Object.fromEntries(services.map((s) => [s.slug, s]));
  const emails = {
    "etat-civil": "etat.civil.consulat@ambassadeliban.fr",
    visa: "visa.consulat@ambassadeliban.fr",
    "legalisations-traductions": "leg.trad.consulat@ambassadeliban.fr",
    procuration: "procuration.consulat@ambassadeliban.fr",
  };

  for (const [serviceSlug, slug, name, order, taxDetail, docs] of DATA) {
    await upsertFormality(svc[serviceSlug].id, emails[serviceSlug], slug, name, order, taxDetail, docs);
  }
  for (const [slug, name, order, taxDetail, docs] of PROC_DATA) {
    await upsertFormality(svc["procuration"].id, emails["procuration"], slug, name, order, taxDetail, docs);
  }

  // Notes communes du service Procuration → bloc de contenu dédié
  await prisma.contentBlock.upsert({
    where: { key_locale: { key: "service.procuration.notes", locale: "fr" } },
    create: { key: "service.procuration.notes", locale: "fr", title: "Notes importantes — Procurations", body: PROC_CONTENT },
    update: { body: PROC_CONTENT },
  });

  // Disponibilités par défaut (schéma fusionné) : par service, lun-ven 9h–14h,
  // créneaux de 20 min — identique au seed de base ; créé seulement si aucune règle.
  const count = await prisma.availabilityRule.count();
  if (count === 0) {
    for (const s of Object.values(svc)) {
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
  }

  const total = await prisma.formality.count();
  console.log(`✅ Seed v2 terminé — ${total} formalités avec contenu complet. Disponibilités : lun-ven 8h30-14h30.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
