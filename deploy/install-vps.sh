#!/usr/bin/env bash
# Installation complète de LibAmbassyFR sur un VPS Debian/Ubuntu.
# Idempotent : réexécutable sans risque.
#
#   sudo bash deploy/install-vps.sh
#
set -euo pipefail

DOMAIN="${DOMAIN:-alfpr.joefr.cloud}"
APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-}"

log()  { printf '\n\033[1;32m▶ %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m⚠ %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31m✖ %s\033[0m\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "À exécuter en root (sudo bash deploy/install-vps.sh)"

# ---------------------------------------------------------------- 1. paquets
log "Installation des paquets système"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq ca-certificates curl gnupg nginx certbot python3-certbot-nginx ufw

if ! command -v docker >/dev/null 2>&1; then
  log "Installation de Docker"
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/"$(. /etc/os-release && echo "$ID")"/gpg \
    -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
https://download.docker.com/linux/$(. /etc/os-release && echo "$ID") \
$(. /etc/os-release && echo "${VERSION_CODENAME}") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
else
  log "Docker déjà présent : $(docker --version)"
fi

# ------------------------------------------------------------------ 2. .env
cd "$APP_DIR"
if [[ ! -f .env ]]; then
  log "Création de .env depuis .env.production.example"
  cp .env.production.example .env
  warn "Complétez les clés Calendly dans $APP_DIR/.env puis relancez ce script."
else
  log ".env déjà présent — conservé tel quel"
fi

# --------------------------------------------------------------- 3. pare-feu
log "Configuration du pare-feu (SSH + HTTP + HTTPS)"
ufw allow OpenSSH >/dev/null 2>&1 || true
ufw allow 'Nginx Full' >/dev/null 2>&1 || true
ufw --force enable >/dev/null 2>&1 || warn "ufw non activé (conteneur/VPS sans netfilter ?)"

# ------------------------------------------------------- 4. build & démarrage
log "Build de l'image et démarrage du conteneur"
docker compose up -d --build

log "Attente de la disponibilité de l'application (port 7100)"
for i in $(seq 1 60); do
  if curl -fsS -o /dev/null http://127.0.0.1:7100/; then
    log "Application UP"
    break
  fi
  [[ $i -eq 60 ]] && { docker compose logs --tail=50 app; die "L'application n'a pas démarré"; }
  sleep 2
done

# ------------------------------------------- 5. nginx phase 1 (HTTP + ACME)
log "Configuration nginx (phase HTTP, challenge ACME)"
mkdir -p /var/www/html
rm -f /etc/nginx/sites-enabled/default
cat > /etc/nginx/sites-available/"$DOMAIN" <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;
    location /.well-known/acme-challenge/ { root /var/www/html; }
    location / {
        proxy_pass http://127.0.0.1:7100;
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        client_max_body_size 500m;
    }
}
NGINX
ln -sfn /etc/nginx/sites-available/"$DOMAIN" /etc/nginx/sites-enabled/"$DOMAIN"
nginx -t && systemctl reload nginx

# ------------------------------------------------ 6. certificat Let's Encrypt
if [[ -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ]]; then
  log "Certificat TLS déjà présent pour $DOMAIN"
else
  log "Obtention du certificat Let's Encrypt pour $DOMAIN"
  CERTBOT_MAIL_ARGS=(--register-unsafely-without-email)
  [[ -n "$LETSENCRYPT_EMAIL" ]] && CERTBOT_MAIL_ARGS=(-m "$LETSENCRYPT_EMAIL")
  certbot certonly --webroot -w /var/www/html -d "$DOMAIN" \
    --agree-tos --non-interactive "${CERTBOT_MAIL_ARGS[@]}" \
    || die "Échec certbot — vérifiez que $DOMAIN pointe bien vers ce serveur et que le port 80 est ouvert."
fi

# certbot ne dépose ces fichiers que via ses plugins : on les crée au besoin.
[[ -f /etc/letsencrypt/options-ssl-nginx.conf ]] || \
  curl -fsSL https://raw.githubusercontent.com/certbot/certbot/main/certbot-nginx/src/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf \
    -o /etc/letsencrypt/options-ssl-nginx.conf
[[ -f /etc/letsencrypt/ssl-dhparams.pem ]] || \
  openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048

# ---------------------------------------- 7. nginx phase 2 (conf définitive)
log "Installation de la configuration nginx définitive (HTTPS)"
cp "$APP_DIR/deploy/nginx/$DOMAIN.conf" /etc/nginx/sites-available/"$DOMAIN"
nginx -t && systemctl reload nginx

systemctl enable --now certbot.timer >/dev/null 2>&1 || \
  warn "certbot.timer indisponible — pensez au renouvellement automatique."

log "Déploiement terminé → https://$DOMAIN"
cat <<'EOF'

Prochaines étapes :
  1. Connectez-vous sur https://alfpr.joefr.cloud/login avec admin@ambassadeliban.fr / Admin123!
  2. CHANGEZ IMMÉDIATEMENT les mots de passe des 3 comptes de démonstration
     (console /admin/utilisateurs).
  3. Renseignez les clés Calendly dans .env puis : bash deploy/update.sh

Commandes utiles :
  docker compose logs -f app      # journaux applicatifs
  docker compose restart app      # redémarrage
  bash deploy/update.sh           # mise à jour depuis git + rebuild
  bash deploy/backup.sh           # sauvegarde base + documents
EOF
