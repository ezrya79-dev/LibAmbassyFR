#!/usr/bin/env bash
# ============================================================
# Provisionnement du VPS pour LibAmbassyFR en mode pm2 (modèle
# YCID) : Node 22 + pm2 + utilisateur deploy + nginx + TLS.
# Idempotent : réexécutable sans risque.
#
#   sudo bash /opt/libambassyfr/deploy/install-vps-pm2.sh
# ============================================================
set -euo pipefail

DOMAIN="${DOMAIN:-alfpr.joefr.cloud}"
APP_DIR="/opt/libambassyfr"
DATA_DIR="/var/lib/libambassyfr"
RUN_AS="deploy"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-}"

log()  { printf '\n\033[1;32m▶ %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m⚠ %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31m✖ %s\033[0m\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "À exécuter en root (sudo bash $0)"
[[ -d "$APP_DIR/.git" ]] || die "Clonez d'abord le dépôt dans $APP_DIR"

# ---------------------------------------------------------------- 1. paquets
log "Paquets système (nginx, certbot, ufw)"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq ca-certificates curl gnupg git nginx certbot python3-certbot-nginx ufw

# ---------------------------------------------------------------- 2. Node 22
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -c2-3)" -lt 22 ]]; then
  log "Installation de Node.js 22 (NodeSource)"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null
  apt-get install -y -qq nodejs
else
  log "Node déjà présent : $(node -v)"
fi

if ! command -v pm2 >/dev/null 2>&1; then
  log "Installation de pm2"
  npm install -g pm2 >/dev/null
else
  log "pm2 déjà présent : $(pm2 -v)"
fi

# ------------------------------------------------------ 3. utilisateur deploy
if ! id "$RUN_AS" >/dev/null 2>&1; then
  log "Création de l'utilisateur $RUN_AS"
  useradd -m -s /bin/bash "$RUN_AS"
else
  log "Utilisateur $RUN_AS déjà présent"
fi

# --------------------------------------------------------- 4. données + .env
log "Répertoires de données ($DATA_DIR)"
mkdir -p "$DATA_DIR/uploads"
chown -R "$RUN_AS:$RUN_AS" "$DATA_DIR"

if [[ ! -f "$APP_DIR/.env" ]]; then
  log "Création de $APP_DIR/.env (chemins pm2)"
  cat > "$APP_DIR/.env" <<ENV
DATABASE_URL="file:$DATA_DIR/app.db"
UPLOAD_DIR="$DATA_DIR/uploads"
APP_URL="https://$DOMAIN"
SESSION_DAYS="7"
MAX_UPLOAD_MB="500"
# Calendly (optionnel — hors parcours depuis la refonte, voir docs/PARCOURS-RDV.md)
CALENDLY_CLIENT_ID=""
CALENDLY_CLIENT_SECRET=""
CALENDLY_WEBHOOK_SIGNING_KEY=""
ENV
  chown "$RUN_AS:$RUN_AS" "$APP_DIR/.env"
else
  log ".env déjà présent — conservé tel quel"
fi

# --------------------------------------------------------------- 5. pare-feu
log "Pare-feu (SSH + HTTP + HTTPS)"
ufw allow OpenSSH >/dev/null 2>&1 || true
ufw allow 'Nginx Full' >/dev/null 2>&1 || true
ufw --force enable >/dev/null 2>&1 || warn "ufw non activé"

# -------------------------------------------------------- 6. premier déploiement
log "Premier déploiement (pull + build + pm2)"
bash "$APP_DIR/deploy/deploy.sh"

log "Démarrage pm2 au boot"
env PATH="$PATH" pm2 startup systemd -u "$RUN_AS" --hp "/home/$RUN_AS" >/dev/null || warn "pm2 startup à vérifier"
sudo -u "$RUN_AS" pm2 save

# ------------------------------------------- 7. nginx phase 1 (HTTP + ACME)
log "nginx (phase HTTP, challenge ACME)"
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

# ------------------------------------------------ 8. certificat Let's Encrypt
if [[ -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ]]; then
  log "Certificat TLS déjà présent pour $DOMAIN"
else
  log "Certificat Let's Encrypt pour $DOMAIN"
  CERTBOT_MAIL_ARGS=(--register-unsafely-without-email)
  [[ -n "$LETSENCRYPT_EMAIL" ]] && CERTBOT_MAIL_ARGS=(-m "$LETSENCRYPT_EMAIL")
  certbot certonly --webroot -w /var/www/html -d "$DOMAIN" \
    --agree-tos --non-interactive "${CERTBOT_MAIL_ARGS[@]}" \
    || die "Échec certbot — vérifiez que $DOMAIN pointe vers ce serveur (port 80 ouvert)."
fi
[[ -f /etc/letsencrypt/options-ssl-nginx.conf ]] || \
  curl -fsSL https://raw.githubusercontent.com/certbot/certbot/main/certbot-nginx/src/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf \
    -o /etc/letsencrypt/options-ssl-nginx.conf
[[ -f /etc/letsencrypt/ssl-dhparams.pem ]] || openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048

# ---------------------------------------- 9. nginx phase 2 (conf définitive)
log "nginx (conf HTTPS définitive)"
cp "$APP_DIR/deploy/nginx/$DOMAIN.conf" /etc/nginx/sites-available/"$DOMAIN"
nginx -t && systemctl reload nginx
systemctl enable --now certbot.timer >/dev/null 2>&1 || warn "certbot.timer indisponible"

log "Installation terminée → https://$DOMAIN"
cat <<'EOF'

Prochaines étapes :
  1. Changez IMMÉDIATEMENT les mots de passe des 3 comptes de démonstration
     (https://alfpr.joefr.cloud/admin/utilisateurs).
  2. Déploiement automatique à chaque merge (modèle YCID) :
       sudo bash /opt/libambassyfr/deploy/setup-runner.sh <TOKEN_GITHUB>
     (token : GitHub → Settings → Actions → Runners → New self-hosted runner)
  3. Sauvegarde quotidienne :
       echo '0 3 * * * root bash /opt/libambassyfr/deploy/backup.sh >> /var/log/libambassyfr-backup.log 2>&1' \
         > /etc/cron.d/libambassyfr-backup

Commandes utiles :
  sudo -u deploy pm2 logs libambassyfr     # journaux
  sudo bash /opt/libambassyfr/deploy/deploy.sh   # redéploiement manuel
EOF
