# Test plan — FTP/BDIX services & add-ons (PR #1, HEAD 0b0da6a)

## What changed (user-visible)
1. A new **Services** hub at `/services` linking 4 category pages: Entertainment, Carrier, Business, Partnership.
2. Each category page renders cards of FTP/BDIX mirror servers with host, protocol, capacity, content types, features.
3. A **Service add-ons** section lists Static IP / IPTV / Cloud Backup / Managed Wi-Fi.
4. **Admin** gets two new CRUD screens: `/admin/ftp` and `/admin/addons`.
5. **Customers** get `/customer/ftp` showing the subset of mirrors they can reach.
6. Security fix (commit 0b0da6a): `/api/public/ftp-servers` now only returns mirrors with `accessLevel: 'public'`; customer/business/partner hostnames are no longer leaked to anonymous visitors.

## Primary adversarial flow (one pass, recorded)

### T1 — Public marketing site shows Services correctly
- **Navigate:** Homepage → click **Services** in the top nav
- **Pass criteria:**
  - URL becomes `/services`
  - Page title `Services`
  - Exactly 4 category cards appear, each with a photo, titled in this order: **Entertainment, Carrier, Business, Partnership**
  - Add-ons section below shows at least 4 cards (Dedicated Static IP, IPTV Bundle, Cloud Backup, Managed Wi-Fi) each with monthly price prefixed with `৳`
- **Would fail if broken?** Yes — a broken hub would 404, be missing categories, or silently drop the add-ons section.

### T2 — Entertainment category page is EMPTY (adversarial: proves security fix)
- **Navigate:** `/services` → click **Entertainment**
- **Expected state (after fix):** The card grid is **empty** and the placeholder text "Our mirrors are being provisioned — check back soon." is visible.
- **Why:** Seeded entertainment mirrors (FTP-CINEMA, FTP-GAMES) are `customer`-tier. Before the fix they would render publicly. After the fix the public endpoint filters to `accessLevel: 'public'` so no entertainment servers are surfaced to anonymous visitors.
- **Would fail if broken?** Yes. Broken behaviour = Cinema Mirror + Game Mirror cards appear with host `cinema.isp.local` / `mirror.isp.local` — the exact data-leak the fix prevents. So "empty state" is the strong positive signal here.

### T3 — Partnership category shows ONLY the public mirror (FTP-EDU)
- **Navigate:** `/services` → click **Partnership**
- **Expected:** A single card titled **Education Mirror** (`FTP-EDU`) with badge `Open to all`, host `edu.isp.local`, capacity 20 TB. FTP-PARTNER (partner-only, 80 TB) must NOT appear.
- **Would fail if broken?** Yes. If the access-level filter regresses, FTP-PARTNER (`Partner CDN Drop`) would appear with a "Partners only" badge — its mere presence on an unauthenticated page is the failure.

### T4 — Direct API probe (adversarial, curl)
Run from a fresh shell without any cookie / token:
```
curl -s http://localhost:4000/api/public/ftp-servers | jq '.items | length, (.[] | .code+": "+.accessLevel)'
```
- **Expected output:** `1` followed by `"FTP-EDU: public"` (exactly one item, exactly `public`).
- **Would fail if broken?** Yes. Count > 1 or any `accessLevel != public` means the security fix regressed.

### T5 — Admin can toggle an FTP server off and it disappears from public
- Log in as admin (admin@example.com / ChangeMe123!).
- Go to `/admin/ftp`. Table shows all 6 seeded servers regardless of access level.
- Find row `FTP-EDU` → click **Disable**.
- Row status flips to `Disabled`.
- Open a new incognito-like tab (or the same tab logged out) → visit `/services/partnership`.
- **Expected:** Partnership page now shows "Partner servers will appear here once provisioned." (FTP-EDU card gone).
- Click **Enable** back in `/admin/ftp`. Reload `/services/partnership` → card returns.
- **Would fail if broken?** Yes. If admin toggle doesn't wire to `isActive`, or if the public endpoint ignores `isActive`, the state of the public page wouldn't track the toggle.

## Out of scope for this recording
- Customer-tier gating on `/customer/ftp` — requires creating a customer + active subscription + password; covered by code review (backend route `apps/api/src/routes/customer.ftp.routes.ts` lines 17-35 is straightforward and typechecked).
- Wallet race-condition fix — concurrency bug, not UI-visible; proven by code change to atomic `findOneAndUpdate` with `$inc`.
- Redis lock Lua-script release — not UI-visible; proven by code change.

These three are cited in the PR comment replies with the specific commit + file path.

## Evidence to capture
- Screen recording of the 5 steps above (ctrl+scroll as needed; annotate with `record_annotate`).
- Screenshots: Services hub, empty Entertainment page (proving no leak), Partnership with only Education Mirror, admin FTP table after toggle.
- Terminal output of T4 curl in the recording.
