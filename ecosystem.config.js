// Configuration pm2 — même modèle que Solid'Pilot (joe17xe/YCID).
// L'application est servie par « next start » sous l'utilisateur deploy ;
// nginx fait le TLS et le reverse proxy devant le port 7100.
module.exports = {
  apps: [
    {
      name: "libambassyfr",
      script: "node_modules/.bin/next",
      args: "start -p 7100",
      cwd: "/opt/libambassyfr",
      env: {
        NODE_ENV: "production",
        PORT: 7100,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
    },
  ],
};
