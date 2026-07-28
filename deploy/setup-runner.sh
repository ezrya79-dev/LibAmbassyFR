#!/usr/bin/env bash
# ============================================================
# Installation du runner GitHub Actions self-hosted pour le
# déploiement automatique de LibAmbassyFR (modèle YCID).
# ============================================================
# À lancer EN ROOT sur le VPS :
#   sudo bash /opt/libambassyfr/deploy/setup-runner.sh <TOKEN_GITHUB>
#
# Le <TOKEN_GITHUB> s'obtient sur :
#   GitHub → dépôt ezrya79-dev/LibAmbassyFR → Settings → Actions → Runners
#   → New self-hosted runner → Linux  (copiez le token après « --token »)
# Le token est valide ~1 h ; relancez la page si expiré.
#
# NB : si le runner YCID tourne déjà sur ce VPS (/opt/actions-runner),
# celui-ci s'installe à côté, dans son propre dossier — un runner ne sert
# qu'un seul dépôt.
set -euo pipefail

REPO_URL="https://github.com/ezrya79-dev/LibAmbassyFR"
RUNNER_USER="deploy"                       # utilisateur qui fait tourner l'app
RUNNER_DIR="/opt/actions-runner-libambassyfr"
LABELS="libambassyfr"                      # doit matcher .github/workflows/deploy.yml
DEPLOY_SCRIPT="/opt/libambassyfr/deploy/deploy.sh"

TOKEN="${1:-${RUNNER_TOKEN:-}}"
[ -n "$TOKEN" ] || { echo "❌ Token requis : sudo bash $0 <TOKEN_GITHUB>" >&2; exit 1; }
[ "$(id -un)" = "root" ] || { echo "❌ Lancez ce script en root (sudo)." >&2; exit 1; }
id "$RUNNER_USER" >/dev/null 2>&1 || { echo "❌ L'utilisateur $RUNNER_USER n'existe pas (lancez d'abord deploy/install-vps-pm2.sh)." >&2; exit 1; }

echo "==> 1/4 Droit sudo sans mot de passe pour le déploiement"
echo "$RUNNER_USER ALL=(root) NOPASSWD: $DEPLOY_SCRIPT" > /etc/sudoers.d/libambassyfr-deploy
chmod 440 /etc/sudoers.d/libambassyfr-deploy
visudo -cf /etc/sudoers.d/libambassyfr-deploy

echo "==> 2/4 Téléchargement du runner (dernière version)"
mkdir -p "$RUNNER_DIR"
chown "$RUNNER_USER:$RUNNER_USER" "$RUNNER_DIR"
VER="$(curl -fsSL https://api.github.com/repos/actions/runner/releases/latest | grep -oP '"tag_name":\s*"v\K[^"]+')"
sudo -u "$RUNNER_USER" bash -c "cd '$RUNNER_DIR' && \
  curl -fsSL -o runner.tar.gz 'https://github.com/actions/runner/releases/download/v${VER}/actions-runner-linux-x64-${VER}.tar.gz' && \
  tar xzf runner.tar.gz && rm -f runner.tar.gz"

echo "==> 3/4 Configuration du runner (label $LABELS)"
# config.sh ne doit PAS tourner en root → exécuté en tant que $RUNNER_USER
sudo -u "$RUNNER_USER" bash -c "cd '$RUNNER_DIR' && ./config.sh \
  --url '$REPO_URL' --token '$TOKEN' --labels '$LABELS' \
  --name libambassyfr-vps --unattended --replace"

echo "==> 4/4 Installation du service (démarrage auto au boot)"
cd "$RUNNER_DIR"
./svc.sh install "$RUNNER_USER"
./svc.sh start

echo "✅ Runner installé et démarré."
echo "   Testez : GitHub → onglet Actions → « Déploiement LibAmbassyFR » → Run workflow,"
echo "   ou mergez n'importe quelle PR sur main — le site se déploiera tout seul."
