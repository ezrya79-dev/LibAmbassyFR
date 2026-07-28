// Config en .mjs (et non .ts) : `next start` doit pouvoir lire la configuration
// sans le paquet `typescript`, absent de l'image de production. Avec un
// next.config.ts, Next tente de l'installer à chaud au démarrage du conteneur.

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
};

export default nextConfig;
