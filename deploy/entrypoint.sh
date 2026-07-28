#!/bin/sh
# Démarrage du conteneur : schéma de base → seed initial (une seule fois) → serveur Next.js
set -e

DB_FILE="$(printf '%s' "${DATABASE_URL:-file:/data/app.db}" | sed 's|^file:||')"
mkdir -p "$(dirname "$DB_FILE")" "${UPLOAD_DIR:-/data/uploads}"

echo "→ Synchronisation du schéma Prisma ($DB_FILE)"
npx --no-install prisma db push --skip-generate

# Le seed utilise des `create` : il n'est pas idempotent. On ne l'exécute donc
# que si la base est vide. SEED_ON_START=0 pour le désactiver totalement.
if [ "${SEED_ON_START:-1}" = "1" ]; then
  node deploy/seed-if-empty.mjs
else
  echo "→ Seed désactivé (SEED_ON_START=0)"
fi

echo "→ Démarrage du serveur sur ${HOSTNAME:-0.0.0.0}:${PORT:-7100}"
exec node_modules/.bin/next start -H "${HOSTNAME:-0.0.0.0}" -p "${PORT:-7100}"
