# Deployment Guide — Fresh Ubuntu VPS

This guide takes a brand-new Ubuntu 22.04 / 24.04 VPS (DigitalOcean, Contabo, Hetzner, etc.)
to a running Desh Communications platform accessible via the server's public IP, then upgraded
to HTTPS on a real domain (e.g. `deshcommunications.net`).

Assumes you have:
- Root SSH access to the VPS with your SSH key.
- A MongoDB Atlas cluster and its connection string.
- ~15 minutes.

---

## 1. Harden the VPS

SSH in as `root`, then run the bootstrap script. It installs Docker, UFW, Fail2Ban,
unattended-upgrades, adds a swap file, creates a non-root `deploy` user, and disables
password SSH.

```bash
ssh root@<vps-ip>
apt-get update -y && apt-get install -y git
git clone https://github.com/<you>/<repo>.git /opt/isp-platform
bash /opt/isp-platform/infra/scripts/setup-vps.sh
```

Log out and log back in as the `deploy` user (it inherited your SSH key):

```bash
ssh deploy@<vps-ip>
```

---

## 2. Pull the repo into the deploy user's home

```bash
git clone https://github.com/<you>/<repo>.git ~/isp-platform
cd ~/isp-platform
```

---

## 3. Configure environment

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env` and set **at minimum**:

```bash
NODE_ENV=production
PORT=4000

# ← IMPORTANT: until you have a domain, just use http://<vps-ip>
CORS_ORIGIN=http://<vps-ip>

MONGODB_URI=mongodb+srv://...

JWT_ACCESS_SECRET=$(openssl rand -hex 64)
JWT_REFRESH_SECRET=$(openssl rand -hex 64)

SEED_ADMIN_EMAIL=you@company.com
SEED_ADMIN_PASSWORD=<strong-password>

# Leave BKASH_MODE=mock until you have real bKash merchant creds.
# Leave MIKROTIK_ENABLED=false until you have a real router reachable from the VPS.
# Leave RADIUS_ENABLED=false until you point to a real FreeRADIUS instance.
```

> **Tip:** generate the two JWT secrets inline:
> ```
> sed -i "s|^JWT_ACCESS_SECRET=.*|JWT_ACCESS_SECRET=$(openssl rand -hex 64)|" apps/api/.env
> sed -i "s|^JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$(openssl rand -hex 64)|" apps/api/.env
> ```

MongoDB Atlas: make sure you've whitelisted your VPS public IP under
**Atlas → Network Access → IP Access List**.

---

## 4. Build and start the stack

```bash
docker compose -f infra/docker-compose.yml up -d --build
```

First build takes a few minutes. Check status:

```bash
docker compose -f infra/docker-compose.yml ps
docker compose -f infra/docker-compose.yml logs -f api
```

Seed the initial admin user + sample packages:

```bash
docker compose -f infra/docker-compose.yml exec api node dist/scripts/seed.js
```

---

## 5. Verify

From your laptop:

```bash
curl http://<vps-ip>/api/health            # {"ok":true,"ts":"..."}
curl http://<vps-ip>/api/health/ready      # {"db":true,"cache":true}
```

Open `http://<vps-ip>/login` in a browser and sign in with `SEED_ADMIN_EMAIL`.

You should land on the admin dashboard at `/admin`.

---

## 6. Add your domain + HTTPS

1. Point an A record for `your-domain.com` at the VPS public IP. Wait for propagation
   (`dig +short your-domain.com` should return the VPS IP).
2. Issue the certificate:
   ```bash
   ./infra/scripts/issue-cert.sh your-domain.com you@your-domain.com
   ```
3. Edit `infra/nginx/conf.d/default.conf`:
   - Replace `server_name _;` with `server_name your-domain.com;` in **both** server blocks.
   - Uncomment the HTTPS server block at the bottom.
   - Uncomment `return 301 https://$host$request_uri;` in the HTTP block.
4. Update `apps/api/.env`:
   ```
   CORS_ORIGIN=https://your-domain.com
   BKASH_CALLBACK_URL=https://your-domain.com/api/payments/bkash/callback
   ```
5. Reload:
   ```bash
   docker compose -f infra/docker-compose.yml restart api
   docker compose -f infra/docker-compose.yml exec nginx nginx -s reload
   ```

Certbot auto-renews via the `certbot` sidecar container (checks twice a day).

---

## 7. Day-2: updates

```bash
ssh deploy@<vps-ip>
cd ~/isp-platform
./infra/scripts/deploy.sh
```

---

## 8. Alternative: PM2 instead of Docker

If you prefer running Node directly on the host:

```bash
# On the VPS
sudo apt-get install -y nodejs npm nginx
sudo npm i -g pnpm pm2

cd ~/isp-platform
pnpm install
pnpm build
pm2 start infra/ecosystem.config.js
pm2 save
pm2 startup systemd   # run the command it prints

# NGINX
sudo cp infra/nginx/conf.d/default.conf /etc/nginx/sites-available/isp
sudo ln -sf /etc/nginx/sites-available/isp /etc/nginx/sites-enabled/isp
# …and replace upstream hostnames `api` / `web` with `127.0.0.1:4000` / `127.0.0.1:3000`
sudo nginx -t && sudo systemctl reload nginx
```

---

## 9. Monitoring & logs

- **PM2 mode**: `pm2 monit`, `pm2 logs`
- **Docker mode**:
  - `docker compose -f infra/docker-compose.yml logs -f api`
  - `docker stats`
- **Structured logs** go to stdout in JSON (production) — pipe into your log aggregator (Loki, Datadog, CloudWatch, etc.).
- **Uptime**: `GET /api/health` is a cheap 200 OK; wire it into UptimeRobot / BetterStack.
- **Errors**: plug Sentry by adding `@sentry/node` and initializing in `apps/api/src/server.ts` before `buildApp()`.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `MongoServerError: bad auth` | Regenerate the Atlas user password, URL-encode it in `MONGODB_URI` |
| `queryTxt ETIMEOUT` on connect | Add the VPS IP to Atlas Network Access, or set it to `0.0.0.0/0` during setup |
| 502 from NGINX | `docker compose logs api` — the API container likely crashed due to bad env |
| Rate-limit errors in dev | Lower the Redis limits or temporarily comment `globalLimiter` in `apps/api/src/app.ts` |
| bKash callback not hit | In mock mode it's hit by the user's browser redirect — check the browser's URL bar |
