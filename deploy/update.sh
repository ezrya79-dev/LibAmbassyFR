#!/usr/bin/env bash
# Mise à jour de LibAmbassyFR : sauvegarde → git pull → rebuild → redémarrage.
#
#   bash deploy/update.sh
#
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

log() { printf '\n\033[1;32m▶ %s\033[0m\n' "$*"; }

log "Sauvegarde préalable"
bash deploy/backup.sh

log "Récupération des dernières modifications"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
git pull origin "$BRANCH"

log "Reconstruction de l'image"
docker compose build

log "Redémarrage"
docker compose up -d

log "Vérification"
for i in $(seq 1 60); do
  if curl -fsS -o /dev/null http://127.0.0.1:7100/; then
    log "Application UP — mise à jour terminée"
    exit 0
  fi
  sleep 2
done

printf '\033[1;31m✖ L'\''application n'\''a pas redémarré :\033[0m\n'
docker compose logs --tail=50 app
exit 1
