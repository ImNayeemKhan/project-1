# Security Checklist

Run through this list before flipping the DNS on production.

## Server

- [ ] `setup-vps.sh` ran cleanly (UFW, Fail2Ban, unattended-upgrades, swap, non-root `deploy` user).
- [ ] Root password login is disabled (`PermitRootLogin prohibit-password`, `PasswordAuthentication no`).
- [ ] SSH key auth only. No password SSH anywhere.
- [ ] UFW allows only 22/80/443. Verify with `sudo ufw status numbered`.
- [ ] Fail2Ban active: `sudo fail2ban-client status sshd`.
- [ ] Automatic security updates enabled (`unattended-upgrades -d --dry-run`).
- [ ] MongoDB Atlas IP Access List contains ONLY the VPS IP (never `0.0.0.0/0` in prod).
- [ ] Backups configured — Atlas Continuous Cloud Backup enabled.
- [ ] Server timezone is UTC (`timedatectl`). Billing cron runs on UTC.

## Secrets

- [ ] `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are distinct, ≥64 hex chars, generated with `openssl rand -hex 64`.
- [ ] `.env` is **not** committed (confirm `git ls-files | grep .env` returns empty).
- [ ] `SEED_ADMIN_PASSWORD` has been rotated after first login; do not leave it in the env.
- [ ] `BCRYPT_ROUNDS ≥ 12`.
- [ ] Router passwords in DB are AES-GCM encrypted (handled automatically by `utils/crypto.ts`).
- [ ] bKash credentials (when live) stored in env only — never logged.

## TLS / HTTPS

- [ ] Certbot issued a Let's Encrypt cert for your domain.
- [ ] HTTPS block in `infra/nginx/conf.d/default.conf` is uncommented.
- [ ] HTTP → HTTPS redirect is active (`return 301 https://…`).
- [ ] HSTS header present (`Strict-Transport-Security`). Test: https://securityheaders.com/
- [ ] TLS 1.2+ only, modern ciphers (NGINX config already enforces this).
- [ ] Cert auto-renewal sidecar is running: `docker compose ps certbot`.

## Application

- [ ] `NODE_ENV=production` in `apps/api/.env`.
- [ ] `CORS_ORIGIN` is the exact production origin (scheme + host, no trailing slash).
- [ ] Rate limits (`express-rate-limit` + NGINX `limit_req_zone`) suit your traffic.
- [ ] `helmet` is enabled (it is by default in `buildApp()`).
- [ ] Input validation (Zod) covers every mutating endpoint.
- [ ] RBAC checks on every `/admin/*` route (`requireRole('admin')` or `'admin', 'reseller'`).
- [ ] Audit log (`AuditLog`) entries are being written for logins / admin actions.

## Payments

- [ ] While `BKASH_MODE=mock`, the payment UI must not be exposed to real customers.
- [ ] When switching to live bKash:
  - [ ] `BKASH_CALLBACK_URL` is HTTPS.
  - [ ] Verify signature / IP allowlist on the callback endpoint (bKash docs).
  - [ ] Reconcile payments daily against bKash merchant portal.
- [ ] Invoices cannot be marked paid by non-admins (check `admin.invoices.routes.ts`).

## Network integration

- [ ] MikroTik API user has minimum privileges (create a dedicated API group with only `ppp` rights).
- [ ] MikroTik API is reachable only from the VPS IP (firewall rule on the router).
- [ ] RADIUS shared secret is long and random.

## Monitoring & incident response

- [ ] Uptime check hitting `/api/health` from an external source.
- [ ] Log shipping / alerting set up (at minimum: crash → email).
- [ ] Sentry (or equivalent) wired for error tracking.
- [ ] On-call runbook: who does what when the server is down.
- [ ] Backup restore tested end-to-end at least once.

## Post-launch

- [ ] First real customer onboarded end-to-end (customer created → subscription provisioned → invoice paid → PPPoE active on router).
- [ ] Suspend flow tested: overdue invoice → customer disconnected.
- [ ] Resume flow tested: payment → customer reconnected.
