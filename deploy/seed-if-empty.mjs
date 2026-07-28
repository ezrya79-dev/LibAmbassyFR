// Exécute prisma/seed.mjs uniquement si la base ne contient encore aucune entité.
// Le seed utilise des `create` (non idempotent) : sans ce garde-fou, chaque
// redémarrage du conteneur dupliquerait services, formalités et comptes.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
let needsSeed = false;
try {
  const count = await prisma.entity.count();
  needsSeed = count === 0;
  if (!needsSeed) console.log(`→ Base déjà initialisée (${count} entité(s)) — seed ignoré`);
} finally {
  await prisma.$disconnect().catch(() => {});
}

if (needsSeed) {
  console.log("→ Base vide — exécution du seed initial");
  // seed.mjs n'attend pas main() au niveau module : on l'exécute dans un
  // process fils pour être certain qu'il se termine avant de rendre la main.
  const seedPath = path.resolve(fileURLToPath(new URL("../prisma/seed.mjs", import.meta.url)));
  // --env-file-if-exists : parité avec `npm run db:seed` en local ; dans le
  // conteneur les variables viennent déjà de l'environnement.
  const res = spawnSync(process.execPath, ["--env-file-if-exists=.env", seedPath], {
    stdio: "inherit",
  });
  if (res.status !== 0) {
    console.error("✖ Échec du seed initial");
    process.exit(res.status ?? 1);
  }
}
