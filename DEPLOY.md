# Déploiement sur VPS — alfpr.joefr.cloud

Guide de mise en production de LibAmbassyFR sur un VPS Debian 12 / Ubuntu 22.04+.

Deux modes sont fournis :

- **Option A (recommandée) — modèle YCID** : pm2 + runner GitHub Actions
  self-hosted, comme Solid'Pilot (`joe17xe/YCID`). Déploiement automatique à
  chaque merge sur `main`, mêmes conventions que le reste de l'infrastructure
  (utilisateur `deploy`, `/opt/<app>`, `deploy.sh` verrouillé, pm2).
- **Option B — Docker Compose** : conteneur isolé, si vous préférez ne rien
  installer globalement sur le VPS.

Dans les deux cas, nginx fait le TLS (Let's Encrypt) devant le port local 7100.

---

## 1. Prérequis

- Un VPS Debian/Ubuntu avec accès `root` (ou `sudo`).
- L'enregistrement DNS **A** `alfpr.joefr.cloud` pointant vers l'IP du VPS.
  Vérification : `dig +short alfpr.joefr.cloud` doit renvoyer l'IP du serveur.
- Les ports **80** et **443** ouverts (les scripts configurent `ufw`).

---

## 2. Option A (recommandée) — pm2 + déploiement automatique (modèle YCID)

### Installation initiale

Sur le VPS, en root :

```bash
apt-get update && apt-get install -y git
git clone -b claude/deploy-vps-ezrya-geii8k https://github.com/ezrya79-dev/libambassyfr.git /opt/libambassyfr
cd /opt/libambassyfr
LETSENCRYPT_EMAIL=ezrya79@gmail.com bash deploy/install-vps-pm2.sh
```

Le script (idempotent) installe Node 22 + pm2 + nginx + certbot, crée
l'utilisateur `deploy`, les répertoires de données (`/var/lib/libambassyfr`),
le `.env`, lance un premier déploiement complet via `deploy/deploy.sh`,
puis met en place le TLS en deux phases (challenge ACME → conf HTTPS).

### Déploiement automatique à chaque merge

Comme pour YCID : un runner GitHub Actions self-hosted sur le VPS exécute
`deploy.sh` à chaque push sur `main` (workflow `.github/workflows/deploy.yml`,
labels `[self-hosted, libambassyfr]`).

```bash
# Token : GitHub → ezrya79-dev/LibAmbassyFR → Settings → Actions → Runners
#         → New self-hosted runner → Linux (valide ~1 h)
sudo bash /opt/libambassyfr/deploy/setup-runner.sh <TOKEN_GITHUB>
```

Si le runner YCID tourne déjà sur ce VPS, celui-ci s'installe **à côté**
(`/opt/actions-runner-libambassyfr`) : un runner ne sert qu'un seul dépôt.

### Exploitation (option A)

```bash
sudo bash /opt/libambassyfr/deploy/deploy.sh        # redéploiement manuel
sudo -u deploy pm2 logs libambassyfr --lines 50     # journaux
sudo -u deploy pm2 status                           # état
bash /opt/libambassyfr/deploy/backup.sh             # sauvegarde ponctuelle
```

`deploy.sh` reprend les correctifs éprouvés du script YCID : remise des droits
sur tout le dépôt avant le pull (objets `.git` créés par root), et
`pm2 startOrRestart --update-env` pour que chaque déploiement recharge le
`.env` (au lieu de conserver d'anciennes valeurs figées).

---

## 3. Option B — Docker Compose

```bash
apt-get update && apt-get install -y git
git clone -b claude/deploy-vps-ezrya-geii8k https://github.com/ezrya79-dev/libambassyfr.git /opt/libambassyfr
cd /opt/libambassyfr
LETSENCRYPT_EMAIL=ezrya79@gmail.com bash deploy/install-vps.sh
```

Le script installe Docker + nginx + certbot, construit l'image
(`Dockerfile` multi-étapes), démarre le conteneur (port local 7100, volume
`data` pour la base et les uploads) et met en place le TLS.

Exploitation : `docker compose logs -f app`, `docker compose restart app`,
`bash deploy/update.sh` (sauvegarde + pull + rebuild + redémarrage).

> Ne mélangez pas les deux options sur le même VPS : choisissez-en une.

---

## 4. Après la première installation — à faire impérativement

Le seed crée trois comptes de démonstration dont les mots de passe sont publics
(ils figurent dans ce dépôt) :

| Compte | Mot de passe | Rôle |
|---|---|---|
| `admin@ambassadeliban.fr` | `Admin123!` | ADMIN |
| `superviseur@ambassadeliban.fr` | `Super123!` | SUPERVISOR |
| `agent.passeport@ambassadeliban.fr` | `Agent123!` | AGENT |

**Changez ces trois mots de passe dès la première connexion** via
`https://alfpr.joefr.cloud/admin/utilisateurs`.

Ensuite, ouvrez **Admin → Disponibilités** pour ajuster les plages de
rendez-vous (le seed ouvre lun–ven 9h–14h, RDV de 20 min).

---

## 5. Configuration Calendly (optionnel)

> Depuis la refonte du parcours (voir `docs/PARCOURS-RDV.md`), la prise de RDV
> est **native** : calendrier, confirmation et gestion se font dans le portail,
> sans Calendly. Cette section ne concerne que la synchronisation optionnelle
> d'agendas Calendly existants pendant une transition. **Vous pouvez sauter
> cette étape** : le portail est pleinement fonctionnel sans.

Dans `/opt/libambassyfr/.env` :

```dotenv
CALENDLY_CLIENT_ID="…"
CALENDLY_CLIENT_SECRET="…"
CALENDLY_WEBHOOK_SIGNING_KEY="…"
```

Puis redéployez (`sudo bash deploy/deploy.sh` ou `bash deploy/update.sh`).

Côté [Calendly Developer](https://developer.calendly.com/) :

- **Redirect URI** : `https://alfpr.joefr.cloud/api/calendly/oauth/callback`
- **Webhook URL** : `https://alfpr.joefr.cloud/api/webhooks/calendly`
  (événements `invitee.created` et `invitee.canceled`)

En production, l'endpoint webhook **rejette toute requête** tant que
`CALENDLY_WEBHOOK_SIGNING_KEY` n'est pas renseignée.

---

## 6. Sauvegardes et données persistées

| Mode | Base SQLite | Documents usagers |
|---|---|---|
| pm2 (option A) | `/var/lib/libambassyfr/app.db` | `/var/lib/libambassyfr/uploads` |
| Docker (option B) | volume `libambassyfr_data` → `/data/app.db` | `/data/uploads` |

`deploy/backup.sh` détecte automatiquement le mode et archive base + uploads
dans `/var/backups/libambassyfr` (rétention 30 jours). Sauvegarde quotidienne :

```bash
echo '0 3 * * * root bash /opt/libambassyfr/deploy/backup.sh >> /var/log/libambassyfr-backup.log 2>&1' \
  > /etc/cron.d/libambassyfr-backup
```

Au déploiement, le schéma est appliqué par `prisma db push` et le seed ne
s'exécute **que si la base est vide** : les redéploiements ne dupliquent
jamais les données.

---

## 7. Dépannage

**Le certificat n'est pas délivré** — vérifiez le DNS et le port 80 :

```bash
dig +short alfpr.joefr.cloud
curl -I http://alfpr.joefr.cloud/.well-known/acme-challenge/test
```

**502 Bad Gateway** — l'application ne répond pas sur 7100 :

```bash
sudo -u deploy pm2 status && sudo -u deploy pm2 logs libambassyfr --lines 50   # option A
docker compose ps && docker compose logs --tail=100 app                        # option B
curl -I http://127.0.0.1:7100/
```

**Le workflow GitHub reste en attente (« Waiting for a runner »)** — le runner
self-hosted est arrêté ou n'a pas le label `libambassyfr` :

```bash
cd /opt/actions-runner-libambassyfr && sudo ./svc.sh status
```

**413 Request Entity Too Large à l'upload** — `client_max_body_size` dans
`deploy/nginx/alfpr.joefr.cloud.conf` doit être ≥ `MAX_UPLOAD_MB` du `.env`.

**Déconnexion immédiate après login** — les cookies de session sont émis avec
l'attribut `Secure` en production : le portail **doit** être servi en HTTPS.

---

## 8. Migration vers PostgreSQL (optionnel)

SQLite convient au volume d'un poste consulaire. Pour passer à PostgreSQL :

1. dans `prisma/schema.prisma`, remplacer `provider = "sqlite"` par `"postgresql"` ;
2. fournir un serveur PostgreSQL et pointer `DATABASE_URL` dessus ;
3. redéployer.

Les données existantes doivent être migrées manuellement (export/import).

---

## 9. Développement local

```bash
npm install
cp .env.example .env
npm run db:push
npm run db:seed
npm run dev          # http://localhost:3000
```

Pour tester le build de production localement : `npm run build && npm start`.
