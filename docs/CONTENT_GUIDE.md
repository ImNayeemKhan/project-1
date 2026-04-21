# Content & Customisation Guide

This guide is the **single source of truth** for the operations team on how to
change anything customer-facing on the platform — branding, packages, zones,
FTP servers, add-ons, announcements, marketing copy, images, and legal pages —
*without* touching the deployment itself.

Everything below is written so that a non-developer with admin access can get
through it; anything that genuinely needs a code change is clearly flagged
with the file path to edit.

---

## 0. Who changes what — a cheat sheet

| You want to change…                               | Where                                               | Who can do it           |
|---------------------------------------------------|-----------------------------------------------------|-------------------------|
| Package names, prices, speeds, descriptions       | Admin → Packages                                     | Admin                    |
| Service zones (coverage areas)                    | Admin → Zones                                        | Admin                    |
| FTP / BDIX mirror servers                         | Admin → FTP servers                                  | Admin                    |
| Service add-ons (Static IP, IPTV, Backup, Wi-Fi)  | Admin → Add-ons                                      | Admin                    |
| Customer-wide announcements                       | Admin → Announcements                                | Admin                    |
| Support tickets, leads (CRM), customer profiles   | Admin → Tickets / Leads / Customers                  | Admin / agent            |
| Wallet balance / manual credits                   | Admin → Wallet (per customer)                        | Admin                    |
| Marketing copy on /, /about, /contact, /services  | Source files under `apps/web/app/(marketing)/`       | Developer (simple edit)  |
| Logo, brand colour, company name in nav/footer    | `MarketingShell.tsx` and `tailwind.config.ts`        | Developer (simple edit)  |
| Phone / email / address shown publicly            | `MarketingShell.tsx` footer                          | Developer (simple edit)  |
| Domain, HTTPS, SMTP, payment gateway keys         | `.env` on the VPS (see `DEPLOYMENT.md`)              | DevOps                   |
| Seeded initial data (first-boot defaults)         | `apps/api/src/scripts/seed.ts`                       | Developer                |

If a task is in the top half of this table, **never edit source code** — do it
from the admin dashboard. You'll just undo your changes the next time someone
redeploys.

---

## 1. Logging in to admin

- URL: `https://<your-domain>/login` (during development: `http://localhost:3000/login`)
- Default admin credentials after first deploy:
  - Email: value of `SEED_ADMIN_EMAIL` in the API `.env` (default `admin@example.com`)
  - Password: value of `SEED_ADMIN_PASSWORD`
- **Rotate the password immediately after your first login.** Go to Admin →
  Customers → find your own account → reset password.

---

## 2. Packages (internet plans)

Packages are what customers see on `/packages` and pick from on `/contact`.

### Add a new package
1. Admin → **Packages** → *Add package*.
2. Fill in:
   - **Name** — e.g. `Home Standard`. Shown on the card.
   - **Code** — short unique identifier (uppercase). Used as the MikroTik
     profile name if you leave `mikrotikProfile` blank. Example: `HOME20`.
   - **Tagline** — one-liner under the name on the card.
   - **Description** — 1–2 sentences shown on the package detail.
   - **Image URL** — any public HTTPS image. See **§10 Images**.
   - **Download / Upload (Mbps)** — the speed pair.
   - **Monthly price** — in your local currency (shown as ৳ by default; see **§11 Currency**).
   - **Setup fee** — one-time fee (0 = Free installation).
   - **FUP (GB)** — optional fair-use cap.
   - **Features** — comma-separated bullet points.
   - **Featured** — one package can be marked as the "Popular" badge.
   - **Sort order** — low numbers show first; leave 10, 20, 30… so you can
     slot new plans in between without renumbering.
3. Save. The change is live on `/packages` within 60 seconds (CDN cache).

### Retire a package
Toggle **Active** off. Existing subscriptions keep billing — only the public
plan grid hides it.

### Never do
- Do not change a package `code` after customers are subscribed to it. The code
  is what the MikroTik adapter reads. Change the name instead.
- Do not delete a package that has active subscriptions. Disable it.

---

## 3. Zones (service areas)

Zones are the coverage areas you advertise on `/contact` and that salespeople
pick when creating subscriptions.

Admin → **Zones** → *Add zone*:
- **Name** (e.g. `Dhanmondi`)
- **Code** (e.g. `DHN`) — used internally for reporting.
- **City**, **Description**, **Coverage note** — all free text.
- **Active** — uncheck to hide from the public `/contact` dropdown without losing history.

---

## 4. FTP / BDIX mirror servers

Covers the four categories you run: **Entertainment**, **Carrier**,
**Business**, **Partnership**. Each category has its own marketing page at
`/services/<category>`.

### Access levels — the most important field

| Access level | Who sees it                              | Where it shows                                    |
|--------------|------------------------------------------|---------------------------------------------------|
| `public`     | Everyone, including anonymous visitors   | `/services/<category>` AND the public API          |
| `customer`   | Logged-in customers with an active sub   | `/customer/ftp` only — hidden from public pages   |
| `business`   | Customers on plans ≥ ৳2500/month         | `/customer/ftp` only                              |
| `partner`    | Never surfaced publicly or to customers  | Staff/NOC use only (exposed via admin console)    |

The public marketing pages **intentionally never leak** `customer`, `business`,
or `partner` hostnames. If you want partners or businesses to find the host,
give them the host directly in a signed email — do not set `accessLevel=public`.

### Add a server
Admin → **FTP servers** → *Add server*:
- **Name**, **Code** (e.g. `FTP-CINEMA-2`, must be unique & uppercase)
- **Category**: entertainment / carrier / business / partnership
- **Access level**: public / customer / business / partner
- **Host**: the hostname or IP that customers connect to (`cinema.isp.local`)
- **Web URL** (optional): a browsable HTTP(S) URL
- **Protocol + Port**: `ftp/21`, `http/80`, `https/443`, `smb/445`
- **Capacity (TB)** and **Max speed (Mbps)** — displayed on the card
- **Content types**: comma-separated (`Movies, Anime, Games`)
- **Features**: comma-separated bullets
- **Image URL**: see **§10 Images**

### Move a server between categories
Edit → change `category`. The server disappears from the old category page and
appears on the new one within 60 seconds.

### Take a server offline (maintenance)
Toggle **Active** off. The card disappears everywhere until you re-enable it.
The server entry itself is preserved so you can bring it back without re-typing
the data.

---

## 5. Service add-ons (Static IP, IPTV, Cloud backup, Managed Wi-Fi, …)

Add-ons appear on `/services` below the four category cards, and customers can
request them from `/contact?addon=<code>`.

Admin → **Add-ons**:
- **Category** drives the default icon copy: `ip`, `iptv`, `backup`, `wifi`, `security`, `other`.
- **Monthly price** + **Setup fee** in local currency.
- **Features** comma-separated. Each feature becomes a checklist bullet.

Leads from the `/contact?addon=…` form land in Admin → Leads with the add-on code
in the notes, so your sales team can pick them up.

---

## 6. Announcements

Admin → **Announcements**:
- **Title**, **Body** (Markdown supported).
- **Audience**:
  - `all` — shown to every logged-in customer
  - `active` — only customers with an active sub
  - `suspended` — only customers whose service is suspended (useful for
    "settle your invoice" reminders)
- **Severity**: `info` / `warning` / `critical` — drives the colour band.
- **Pinned** — keeps it at the top of `/customer/announcements` regardless of date.

---

## 7. Support tickets (customer ↔ admin)

- Customers raise tickets at `/customer/tickets/new`.
- Admins triage at **Admin → Tickets**.
- Ticket numbers (`TK-XXXX`) are auto-generated. Do not try to override them.
- Changing **Status** to `resolved` does not hide the ticket — the customer can
  re-open it with a reply. Use `closed` to permanently end the thread.
- **Priority** is an internal routing field. `urgent` tickets are highlighted
  red in the list.

---

## 8. Leads (sales pipeline)

- Incoming `/contact` form submissions create leads in `status = new`.
- Walk-ins / phone-ins: Admin → **Leads** → *Add lead* with `source = walkin` or `phone`.
- Pipeline stages: `new → contacted → qualified → won → lost`.
- Once a lead becomes a customer, **do not delete the lead** — move it to `won`.
  The history is audit evidence that the customer consented to be contacted.

---

## 9. Wallet / manual adjustments

Admin → pick a customer → **Wallet**.
- **Credit** adds to the customer's wallet balance (e.g. promotional refund).
- **Debit** subtracts (e.g. charging an ad-hoc fee).
- Every adjustment creates a row in the transaction ledger with your user ID as
  `createdBy` — this is auditable. Use the **Note** field to explain why.
- The adjustment is **atomic** — two concurrent requests cannot race past the
  balance check (we rely on MongoDB's `$inc` with a precondition).

---

## 10. Images — where to get them, how to set them

All marketing imagery is loaded from `imageUrl` fields. We recommend
**Unsplash** (free, commercial-use allowed) for stock shots and your own CDN
for product photography.

### Unsplash
1. Find a photo at https://unsplash.com.
2. Right-click the photo → *Copy image address*.
3. Paste into the `imageUrl` field. You can append `?auto=format&fit=crop&w=1200&q=80`
   to auto-resize and compress.

Example: `https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80`

### Your own images
Host them somewhere with a stable HTTPS URL — S3, Cloudflare R2, BunnyCDN, or
your own `static.isp.net` bucket. Paste the public URL into `imageUrl`.

### Image sizes we render
| Where                    | Aspect   | Sweet spot        |
|--------------------------|----------|-------------------|
| Hero / services card     | 3:2      | 1200×800 px       |
| Package card top banner  | 16:9     | 1200×675 px       |
| FTP card thumbnail       | 16:9     | 800×450 px        |
| Add-on thumbnail         | 4:3      | 800×600 px        |

You do not need to pre-crop — the frontend uses `object-cover` so any size
looks right — but anything under 600 px wide will look fuzzy on retina screens.

---

## 11. Branding (logo, colour, company name)

These are the few places where a non-content change is still a code change.

### Company name
File: <ref_file file="apps/web/components/MarketingShell.tsx" />
- Header brand link (line ~9) — `ISP Platform`
- Footer title and copyright line
- Also: `apps/web/app/layout.tsx` `metadata.title`

### Brand colour
File: <ref_file file="apps/web/tailwind.config.ts" />
- Under `theme.extend.colors.brand` there is a `50` → `900` colour scale.
  Replace with your palette (e.g. generated at https://uicolors.app/).
- `brand-600` is the primary button colour.
- Tailwind rebuilds on save; no migration needed.

### Logo
- Drop a PNG/SVG at `apps/web/public/logo.svg`.
- In `MarketingShell.tsx`, replace the `<Link href="/" className="text-lg ...">ISP Platform</Link>`
  block with `<img src="/logo.svg" alt="Your Company" className="h-8" />`.

### Contact block in the footer
Same file, search for `+880 9000 000 000` and `hello@ispplatform.example`.
Replace phone, email, and postal address.

### Legal / policy pages
- Add files under `apps/web/app/(marketing)/legal/<slug>/page.tsx`.
- Create a folder per page: `privacy`, `terms`, `acceptable-use`, `refund`, …
- Link them in `MarketingShell.tsx` footer.

---

## 12. Currency, locale, timezone

### Currency
Prices throughout the UI are labelled as `৳` (Bangladeshi taka). To change:
1. `apps/web/app/(marketing)/packages/page.tsx` — replace `৳` in the JSX.
2. `apps/web/app/(marketing)/services/page.tsx` — same.
3. `apps/web/app/admin/packages/page.tsx`, `admin/addons/page.tsx`, `admin/wallet/page.tsx` — same.
4. The invoice PDF generator (future work) reads from `apps/api/src/config/env.ts` —
   set `APP_CURRENCY`.

There is **no automatic FX conversion**. You enter prices in one currency and
charges happen in that currency.

### Timezone
- API cron runs in the container's timezone (default: `UTC`).
- To change: in `apps/api/Dockerfile`, add `ENV TZ=Asia/Dhaka` above `CMD`.
- Billing cron schedule is `0 2 * * *` (2 am local time) — edit in
  `apps/api/src/jobs/billing.job.ts` if you want to shift the window.

### Language
Everything is currently English. For Bengali:
1. Wire up `next-intl` (not included by default).
2. Move every user-facing string out of `.tsx` files into `apps/web/messages/{bn,en}.json`.
3. Wrap pages in `<NextIntlClientProvider>`.
This is a 1–2 day job; ask engineering.

---

## 13. Emails (transactional)

Not yet wired to SMTP — the API logs "would send email" today. To turn it on:
1. Provision an SMTP relay (SendGrid, SES, Mailgun). Get `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.
2. Paste into `apps/api/.env` on the VPS.
3. Email templates live in `apps/api/src/templates/email/*.hbs`. Edit any file,
   restart the API (`pm2 restart isp-api`), changes go live.
4. Variables available in templates: `{{customer.name}}`, `{{invoice.number}}`,
   `{{invoice.amount}}`, `{{link}}`, `{{supportPhone}}`. See
   `apps/api/src/services/email.service.ts` for the full list.

### Which events send email
| Event                          | Template             | When                          |
|--------------------------------|----------------------|-------------------------------|
| Customer created               | `welcome.hbs`        | Admin adds a customer         |
| Invoice generated              | `invoice-new.hbs`    | Billing cron, monthly         |
| Invoice overdue (warning)      | `invoice-overdue.hbs`| Invoice past due by 3 days    |
| Service suspended              | `suspended.hbs`      | Overdue ≥ 7 days              |
| Payment received               | `payment-ok.hbs`     | bKash callback success        |
| Password reset                 | `password-reset.hbs` | Customer clicks "Forgot password" |

---

## 14. Payment gateway (bKash)

Shipped in `mock` mode by default. Full swap-in procedure:

1. Get production credentials from bKash Merchant dashboard:
   - `BKASH_APP_KEY`, `BKASH_APP_SECRET`, `BKASH_USERNAME`, `BKASH_PASSWORD`.
2. Add to `apps/api/.env` on the VPS.
3. Set `BKASH_MODE=live` (was `mock`).
4. Whitelist the VPS IP in the bKash merchant portal.
5. Configure the callback URL in the bKash dashboard:
   `https://<your-domain>/api/payments/bkash/callback`
6. `pm2 restart isp-api` — test with a 1 ৳ charge on your own number first.

The code path is unchanged between mock and live — if mock works, live works.
Do not edit `apps/api/src/services/payments/bkash.*.ts` to "shortcut" live
testing. The mock gateway already mirrors every happy-path and failure case.

---

## 15. MikroTik / RADIUS integration

Shipped in **dry-run mode**. When a plan is created/suspended in dry-run, the
adapter logs what it *would* have done on the router. To go live:

1. `MIKROTIK_ENABLED=true` in `apps/api/.env`.
2. Fill in `MIKROTIK_HOST`, `MIKROTIK_PORT` (default 8728), `MIKROTIK_USER`, `MIKROTIK_PASSWORD`.
3. Create a dedicated `api` user on the router with only the permissions
   `read, write, policy, test, sensitive`. Do **not** give it `full`.
4. Restart API. First provisioning cycle will log connected/verified.
5. For each Package, set **Mikrotik profile** to the exact `/ppp profile` name
   on the router. If blank, we default to the package `code`.

For RADIUS: `RADIUS_ENABLED=true`, `RADIUS_SECRET=…`, `RADIUS_HOST=…`. Our
layer speaks Access-Request, Accounting, and CoA-Disconnect.

---

## 16. Seed data (first-boot defaults)

File: <ref_file file="apps/api/src/scripts/seed.ts" />

This script runs **once** on a fresh database and installs:
- One admin user (from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`)
- 6 default packages, 4 zones, 3 announcements, 2 leads
- 6 FTP servers (entertainment/carrier/business/partnership)
- 4 default add-ons

If you change the seed file *after* first boot, you must delete the
corresponding rows from the DB (or run with `--force` — currently unimplemented,
ask engineering to add if you need it) for the new defaults to apply. In
production you normally just **don't** re-seed; edit via the admin UI instead.

---

## 17. Making a change — recommended workflow

1. **If it's content** (packages, FTP, zones, announcements, add-ons):
   - Go to Admin UI → make the edit → save.
   - Verify on the public site (hit refresh, allow ~60 s for CDN).
   - Done. No deploy.
2. **If it's copy or branding** (marketing text, colour, logo):
   - Checkout a new branch: `git checkout -b content/<short-name>`.
   - Edit the file (listed above).
   - Commit with `git commit -m "content: <what>"` and open a PR.
   - Merge after review. GitHub Actions rebuilds and redeploys automatically
     (see `.github/workflows/ci.yml`).
3. **If it's pricing / currency / locale**:
   - Plan a maintenance window — invoices already issued are in the old
     currency and must not be retroactively converted.
   - Change the label (see **§12**), redeploy, announce.

---

## 18. Support escalation

If a dashboard change "isn't showing up":
- Hard-refresh the public page (CDN cache is 60 s).
- Check the record's **Active** toggle.
- Check **Sort order** — a very high sort order pushes it below the fold.

If a change broke the site (500s):
- `pm2 logs isp-api --lines 200` on the VPS, or Sentry if you wired it.
- Flip the offending record's **Active** off via admin, then investigate.

If you can't log in:
- SSH to the VPS.
- `docker exec isp-api pnpm --filter @isp/api exec tsx src/scripts/reset-admin.ts`
  (creates a fresh admin or resets the existing one — the script reads
  `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` from `.env`).

---

## 19. What **not** to edit directly in the database

Never write SQL/Mongo against:
- `invoices` — breaks reconciliation with bKash and the payment ledger.
- `transactions` — tampering breaks wallet integrity and audit trail.
- `payments` — breaks idempotency and can cause double-charging.
- `subscriptions.status` — only the billing job and admin UI should change
  this; raw writes skip MikroTik/RADIUS provisioning and leave routers out of
  sync with the billing state.

If you absolutely must, use the admin UI equivalents (refund flow, manual
wallet adjust, "suspend service" button). They record *who* made the change,
*when*, and *why* — a direct DB write doesn't.
