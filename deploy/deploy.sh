#!/usr/bin/env bash
# ============================================================
# Déploiement LibAmbassyFR — commande unique, à lancer en root :
#   sudo bash /opt/libambassyfr/deploy/deploy.sh
# ============================================================
# Même modèle que Solid'Pilot (joe17xe/YCID), avec ses correctifs
# éprouvés : droits remis sur TOUT le dépôt avant le pull (un git
# lancé en root laisse des objets root dans .git → pull en échec),
# et « pm2 --update-env » pour que chaque déploiement recharge
# l'environnement (.env) au lieu de figer d'anciennes valeurs.
set -euo pipefail

APP_DIR="/opt/libambassyfr"
RUN_AS="deploy"
PORT=7100
DATA_DIR="/var/lib/libambassyfr"

if [ "$(id -un)" != "root" ]; then
  echo "❌ Lancez ce script en root : sudo bash $0" >&2
  exit 1
fi

cd "$APP_DIR"

REPO_ROOT="$(git -C "$APP_DIR" -c safe.directory='*' rev-parse --show-toplevel 2>/dev/null || echo "$APP_DIR")"
echo "==> 1/7 Droits sur $REPO_ROOT et $DATA_DIR (utilisateur $RUN_AS)"
chown -R "$RUN_AS:$RUN_AS" "$REPO_ROOT"
chmod -R u+rwX "$REPO_ROOT"
mkdir -p "$DATA_DIR/uploads"
chown -R "$RUN_AS:$RUN_AS" "$DATA_DIR"

BRANCH="$(sudo -u "$RUN_AS" git -C "$APP_DIR" rev-parse --abbrev-ref HEAD)"
echo "==> 2/7 Mise à jour du code (origin/$BRANCH)"
sudo -u "$RUN_AS" git -C "$APP_DIR" pull origin "$BRANCH"

echo "==> 3/7 Dépendances"
sudo -u "$RUN_AS" bash -c "cd '$APP_DIR' && npm ci --no-audit --no-fund"

echo "==> 4/7 Base de données (prisma db push + seed si base vide)"
# Le projet fonctionne en `db push` (pas de migrations) : --accept-data-loss
# évite qu'un simple ajout d'index unique bloque le déploiement. Le seed ne
# s'exécute que si la base est vide (deploy/seed-if-empty.mjs).
sudo -u "$RUN_AS" bash -c "cd '$APP_DIR' && npx --no-install prisma db push --skip-generate --accept-data-loss"
sudo -u "$RUN_AS" bash -c "cd '$APP_DIR' && node --env-file-if-exists=.env deploy/seed-if-empty.mjs"

VERSION="$(sudo -u "$RUN_AS" git -C "$APP_DIR" rev-parse --short HEAD)"
BUILD_TIME="$(date '+%d/%m/%Y %H:%M')"
echo "==> 5/7 Build (version $VERSION — $BUILD_TIME)"
sudo -u "$RUN_AS" bash -c "cd '$APP_DIR' && npm run build"

echo "==> 6/7 Redémarrage pm2 (utilisateur $RUN_AS)"
# --update-env : recharge l'environnement à CHAQUE déploiement pour que
# « next start » reprenne les valeurs actuelles de .env (leçon YCID).
sudo -u "$RUN_AS" bash -c "cd '$APP_DIR' && pm2 startOrRestart ecosystem.config.js --update-env"
sudo -u "$RUN_AS" pm2 save

echo "==> 7/7 Vérification"
sleep 3
if curl -sf "http://localhost:$PORT/" | grep -q "e-services"; then
  echo "✅ Déploiement OK — build $VERSION ($BUILD_TIME) en ligne sur le port $PORT"
else
  echo "❌ Le nouveau build ne répond pas comme attendu." >&2
  echo "   Diagnostic : sudo -u $RUN_AS pm2 logs libambassyfr --lines 30 --nostream" >&2
  exit 1
fi
