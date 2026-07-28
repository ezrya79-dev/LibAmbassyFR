# Déploiement sur VPS — alfpr.joefr.cloud

Guide de mise en production de LibAmbassyFR sur un VPS Debian 12 / Ubuntu 22.04+.
L'application tourne dans un conteneur Docker derrière nginx (TLS Let's Encrypt).

---

## 1. Prérequis

- Un VPS Debian/Ubuntu avec accès `root` (ou `sudo`).
- L'enregistrement DNS **A** `alfpr.joefr.cloud` pointant vers l'IP du VPS.
  Vérification : `dig +short alfpr.joefr.cloud` doit renvoyer l'IP du serveur.
- Les ports **80** et **443** ouverts (le script configure `ufw`).

---

## 2. Installation (une seule commande)

Sur le VPS, en root :

```bash
apt-get update && apt-get install -y git
git clone -b claude/deploy-vps-ezrya-geii8k https://github.com/ezrya79-dev/libambassyfr.git /opt/libambassyfr
cd /opt/libambassyfr
LETSENCRYPT_EMAIL=ezrya79@gmail.com bash deploy/install-vps.sh
```

Le script `deploy/install-vps.sh` est **idempotent** — il peut être relancé sans risque. Il :

1. installe Docker, nginx, certbot et ufw ;
2. crée `.env` depuis `.env.production.example` s'il n'existe pas ;
3. ouvre le pare-feu (SSH + HTTP + HTTPS) ;
4. construit l'image et démarre le conteneur, puis attend que l'app réponde ;
5. installe une conf nginx HTTP le temps du challenge ACME ;
6. obtient le certificat Let's Encrypt (`certbot certonly --webroot`) ;
7. bascule sur la conf nginx HTTPS définitive et active le renouvellement auto.

À l'issue, le portail est disponible sur **https://alfpr.joefr.cloud**.

---

## 3. Après la première installation — à faire impérativement

Le seed crée trois comptes de démonstration dont les mots de passe sont publics
(ils figurent dans ce dépôt) :

| Compte | Mot de passe | Rôle |
|---|---|---|
| `admin@ambassadeliban.fr` | `Admin123!` | ADMIN |
| `superviseur@ambassadeliban.fr` | `Super123!` | SUPERVISOR |
| `agent.passeport@ambassadeliban.fr` | `Agent123!` | AGENT |

**Changez ces trois mots de passe dès la première connexion** via
`https://alfpr.joefr.cloud/admin/utilisateurs`. Tant que ce n'est pas fait, la
console d'administration est accessible à quiconque a lu ce dépôt.

---

## 4. Configuration Calendly (optionnel)

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

Puis `bash deploy/update.sh` (ou `docker compose up -d`) pour recharger.

Côté [Calendly Developer](https://developer.calendly.com/) :

- **Redirect URI** : `https://alfpr.joefr.cloud/api/calendly/oauth/callback`
- **Webhook URL** : `https://alfpr.joefr.cloud/api/webhooks/calendly`
  (événements `invitee.created` et `invitee.canceled`)

> En production, l'endpoint webhook **rejette toute requête** tant que
> `CALENDLY_WEBHOOK_SIGNING_KEY` n'est pas renseignée (HTTP 500). C'est
> volontaire : aucun événement non signé n'est accepté.

L'appairage OAuth se lance ensuite depuis `/admin/calendly`.

---

## 5. Exploitation courante

```bash
cd /opt/libambassyfr

docker compose logs -f app     # journaux en direct
docker compose ps              # état du conteneur
docker compose restart app     # redémarrage
docker compose down            # arrêt

bash deploy/update.sh          # sauvegarde + git pull + rebuild + redémarrage
bash deploy/backup.sh          # sauvegarde ponctuelle
```

### Sauvegardes automatiques

`deploy/backup.sh` archive la base SQLite et les documents usagers dans
`/var/backups/libambassyfr` (rétention 30 jours). Pour une sauvegarde
quotidienne à 3 h :

```bash
echo '0 3 * * * root cd /opt/libambassyfr && bash deploy/backup.sh >> /var/log/libambassyfr-backup.log 2>&1' \
  > /etc/cron.d/libambassyfr-backup
```

---

## 6. Ce qui est persisté

Tout l'état vit dans le volume Docker `libambassyfr_data`, monté sur `/data` :

| Chemin | Contenu |
|---|---|
| `/data/app.db` | base SQLite (services, RDV, usagers, comptes, contenus) |
| `/data/uploads` | pièces jointes déposées par les usagers |

Le volume survit à `docker compose down` et aux rebuilds d'image. Il n'est
supprimé que par `docker compose down -v` — **à ne jamais lancer en production**.

Au démarrage, le conteneur applique le schéma (`prisma db push`) puis n'exécute
le seed **que si la base est vide** (`deploy/seed-if-empty.mjs`). Les
redémarrages ne dupliquent donc jamais les données.

---

## 7. Dépannage

**Le certificat n'est pas délivré** — vérifiez que le DNS est propagé et que le
port 80 est joignable depuis l'extérieur :

```bash
dig +short alfpr.joefr.cloud
curl -I http://alfpr.joefr.cloud/.well-known/acme-challenge/test
```

**502 Bad Gateway** — le conteneur ne répond pas sur 7100 :

```bash
docker compose ps
docker compose logs --tail=100 app
curl -I http://127.0.0.1:7100/
```

**413 Request Entity Too Large à l'upload** — `client_max_body_size` dans
`deploy/nginx/alfpr.joefr.cloud.conf` doit être ≥ `MAX_UPLOAD_MB` du `.env`
(500 Mo des deux côtés par défaut).

**Déconnexion immédiate après login** — les cookies de session sont émis avec
l'attribut `Secure` en production : le portail **doit** être servi en HTTPS.
Un accès direct en `http://IP:7100` ne permettra pas de rester connecté.

---

## 8. Migration vers PostgreSQL (optionnel)

SQLite convient au volume d'un poste consulaire. Pour passer à PostgreSQL :

1. dans `prisma/schema.prisma`, remplacer `provider = "sqlite"` par `"postgresql"` ;
2. ajouter un service `db` (image `postgres:16`) dans `docker-compose.yml` ;
3. pointer `DATABASE_URL` sur `postgresql://user:pass@db:5432/libambassy` ;
4. rebuild : `docker compose up -d --build`.

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

Pour tester le build de production localement :

```bash
npm run build && npm start
```
