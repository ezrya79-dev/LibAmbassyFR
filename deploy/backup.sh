#!/usr/bin/env bash
# Sauvegarde de la base SQLite et des documents déposés par les usagers.
# Détecte le mode de déploiement : pm2 (données dans /var/lib/libambassyfr)
# ou Docker (volume monté sur /data dans le conteneur `libambassyfr`).
# Les archives sont conservées 30 jours dans /var/backups/libambassyfr.
#
#   bash deploy/backup.sh
#
set -euo pipefail

DEST="${BACKUP_DIR:-/var/backups/libambassyfr}"
CONTAINER="${CONTAINER:-libambassyfr}"
DATA_DIR="${DATA_DIR:-/var/lib/libambassyfr}"
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$DEST"

if [ -f "$DATA_DIR/app.db" ]; then
  # --- Mode pm2 : les données sont directement sur le disque ---
  if command -v sqlite3 >/dev/null 2>&1; then
    sqlite3 "$DATA_DIR/app.db" ".backup '$DEST/app-$STAMP.db'"
  else
    cp "$DATA_DIR/app.db" "$DEST/app-$STAMP.db"
  fi
  tar czf "$DEST/uploads-$STAMP.tgz" -C "$DATA_DIR" uploads
elif command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  # --- Mode Docker : copie cohérente depuis le conteneur ---
  docker exec "$CONTAINER" sh -c \
    'command -v sqlite3 >/dev/null && sqlite3 /data/app.db ".backup /tmp/app-backup.db" || cp /data/app.db /tmp/app-backup.db'
  docker cp "$CONTAINER":/tmp/app-backup.db "$DEST/app-$STAMP.db"
  docker exec "$CONTAINER" rm -f /tmp/app-backup.db
  docker exec "$CONTAINER" tar czf /tmp/uploads.tgz -C /data uploads
  docker cp "$CONTAINER":/tmp/uploads.tgz "$DEST/uploads-$STAMP.tgz"
  docker exec "$CONTAINER" rm -f /tmp/uploads.tgz
else
  echo "⚠ Aucune base trouvée ($DATA_DIR/app.db absent, conteneur $CONTAINER arrêté) — sauvegarde ignorée"
  exit 0
fi

find "$DEST" -type f -mtime +30 -delete

echo "✔ Sauvegarde : $DEST/app-$STAMP.db · $DEST/uploads-$STAMP.tgz"
