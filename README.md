# ISP Platform

A production-ready starter for running a small-to-mid ISP:

- **Admin dashboard** — customers, packages, subscriptions, invoices, MikroTik routers
- **Customer portal** — view plan, pay invoices
- **Billing engine** — monthly auto-invoices, grace-period → auto-suspend, auto-resume on payment
- **MikroTik adapter** — RouterOS API wrapper (dry-runs when no router is bound)
- **RADIUS layer** — CoA / Disconnect-Request stub for FreeRADIUS
- **Mock bKash** payment gateway (shaped like the real Tokenized Checkout flow)
- **Deployable** via Docker Compose (NGINX + Node API + Next.js web + Redis) or PM2

## Stack

| Layer | Tech |
|-------|------|
| Backend | Node 20, Express 4, TypeScript, Mongoose |
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS, SWR |
| DB | MongoDB Atlas |
| Cache / rate-limit | Redis |
| Reverse proxy | NGINX (TLS via Certbot) |
| Process mgmt | Docker Compose *or* PM2 cluster |

## Repo layout

```
apps/
  api/           Express + Mongoose backend
  web/           Next.js frontend (admin + customer portals)
infra/
  docker-compose.yml
  nginx/         Reverse proxy config
  scripts/       VPS bootstrap, cert issuance, deploy
  ecosystem.config.js  PM2 alternative to Docker
docs/
  DEPLOYMENT.md  Step-by-step VPS deploy guide
  SECURITY.md    Security checklist
```

## Quick local start

```bash
# 1. Install deps
pnpm install

# 2. Configure
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Edit apps/api/.env and set:
#   MONGODB_URI=<your Atlas URI>
#   JWT_ACCESS_SECRET=$(openssl rand -hex 64)
#   JWT_REFRESH_SECRET=$(openssl rand -hex 64)

# 3. Seed an admin + default packages
pnpm --filter @isp/api seed

# 4. Dev servers (api :4000, web :3000)
pnpm dev
```

Login at http://localhost:3000/login with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.

## Production deploy

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the step-by-step VPS guide.

TL;DR:

```bash
# On a fresh Ubuntu VPS, as root
curl -fsSL https://raw.githubusercontent.com/<you>/<repo>/main/infra/scripts/setup-vps.sh | bash

# As the deploy user
git clone https://github.com/<you>/<repo>.git ~/isp-platform
cd ~/isp-platform
cp apps/api/.env.example apps/api/.env && $EDITOR apps/api/.env
docker compose -f infra/docker-compose.yml up -d --build
docker compose -f infra/docker-compose.yml exec api node dist/scripts/seed.js

# Once DNS points here:
./infra/scripts/issue-cert.sh your-domain.com you@your-domain.com
```

## What's placeholder / swap-ready

| Area | Status | To go live |
|------|--------|-----------|
| bKash | mock mode (`BKASH_MODE=mock`) | Set `BKASH_MODE=live`, fill `BKASH_*` secrets, implement the live HTTP calls in `bkash.service.ts` (marked with TODO comments) |
| MikroTik | dry-run if `MIKROTIK_ENABLED=false` or no router bound | Add a Router in the admin UI or set `MIKROTIK_ENABLED=true` with env creds |
| RADIUS | disabled by default | Set `RADIUS_ENABLED=true` + server details; CoA port is `RADIUS_ACCT_PORT` (use 3799) |
| Domain + SSL | IP-only works out of the box | Point DNS, run `issue-cert.sh`, uncomment HTTPS block in NGINX |

See [docs/SECURITY.md](docs/SECURITY.md) before going live.
