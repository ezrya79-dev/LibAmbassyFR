#!/usr/bin/env bash
# Sauvegarde de la base SQLite et des documents déposés par les usagers.
# Les archives sont conservées 30 jours dans /var/backups/libambassyfr.
#
#   bash deploy/backup.sh
#
set -euo pipefail

DEST="${BACKUP_DIR:-/var/backups/libambassyfr}"
CONTAINER="${CONTAINER:-libambassyfr}"
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$DEST"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "⚠ Conteneur $CONTAINER non démarré — sauvegarde ignorée"
  exit 0
fi

# `.backup` produit une copie cohérente même si l'application écrit pendant ce temps.
# Repli sur une copie brute si sqlite3 n'est pas installé dans l'image.
docker exec "$CONTAINER" sh -c \
  'command -v sqlite3 >/dev/null && sqlite3 /data/app.db ".backup /tmp/app-backup.db" || cp /data/app.db /tmp/app-backup.db'
docker cp "$CONTAINER":/tmp/app-backup.db "$DEST/app-$STAMP.db"
docker exec "$CONTAINER" rm -f /tmp/app-backup.db

docker exec "$CONTAINER" tar czf /tmp/uploads.tgz -C /data uploads
docker cp "$CONTAINER":/tmp/uploads.tgz "$DEST/uploads-$STAMP.tgz"
docker exec "$CONTAINER" rm -f /tmp/uploads.tgz

find "$DEST" -type f -mtime +30 -delete

echo "✔ Sauvegarde : $DEST/app-$STAMP.db · $DEST/uploads-$STAMP.tgz"
