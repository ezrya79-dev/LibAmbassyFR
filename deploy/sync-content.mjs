// Rattrapage de contenu pour une base DÉJÀ seedée (le seed ne s'exécute que
// sur base vide). Idempotent et non destructif : crée uniquement ce qui
// manque (par slug), ne modifie jamais une formalité existante — les
// éditions faites en console d'administration sont préservées.
//
//   node --env-file-if-exists=.env deploy/sync-content.mjs
//
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Liste complète relevée sur le portail d'origine (captures du 29/07/2026).
const MISSING = {
  procuration: [
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
  ],
};

let created = 0;
for (const [serviceSlug, formalities] of Object.entries(MISSING)) {
  const service = await prisma.service.findFirst({ where: { slug: serviceSlug } });
  if (!service) {
    console.log(`⚠ Service « ${serviceSlug} » introuvable — ignoré`);
    continue;
  }
  const maxOrder = await prisma.formality
    .aggregate({ where: { serviceId: service.id }, _max: { order: true } })
    .then((r) => r._max.order ?? 0);
  let order = maxOrder;
  for (const [slug, name] of formalities) {
    const exists = await prisma.formality.findUnique({
      where: { serviceId_slug: { serviceId: service.id, slug } },
    });
    if (exists) continue;
    order++;
    await prisma.formality.create({
      data: {
        serviceId: service.id,
        slug,
        name,
        order,
        emailContact: service.contactEmail,
        description:
          "[À COMPLÉTER] Détail des pièces requises et taxes à renseigner depuis la console d'administration.",
      },
    });
    created++;
    console.log(`+ ${service.name} → ${name}`);
  }
}

console.log(created ? `✔ ${created} formalité(s) ajoutée(s)` : "✔ Rien à ajouter — contenu déjà à jour");
await prisma.$disconnect();
