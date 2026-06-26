# Deploying SoilConnect

SoilConnect is a **single service**: the Express server (`server.js`) serves both
the API (`/api/*`) and the built React frontend (`dist/`). One process, one port,
one URL — no CORS to configure, one thing to deploy.

- **Build:** `npm install && npm run build`  (compiles the React app into `dist/`)
- **Run:**   `node server.js`  (serves API + frontend when `NODE_ENV=production`)
- **Health check:** `GET /api/health` → `{"status":"ok"}`

---

## Option A — Render (recommended, no Docker needed)

A [`render.yaml`](render.yaml) blueprint is included.

1. Push this repo to GitHub.
2. On **render.com** → **New** → **Blueprint**, pick the repo. Render reads
   `render.yaml`, builds (`npm install && npm run build`), and starts
   (`node server.js`).
3. After the first deploy, set **`APP_URL`** in the dashboard to your service URL
   (e.g. `https://soilconnect.onrender.com`) so email links are correct. Redeploy.
4. Open the URL and sign up — you're live.

**Cost & data persistence:** the blueprint defaults to Render's **free plan
($0)** — perfect for a first beta. Two caveats on free: the service sleeps after
~15 min idle (first visit then takes ~30–60s to wake), and there's no permanent
storage, so the JSON datastore resets on each redeploy. To go **always-on with
durable data**, upgrade the instance to **Starter (~$7/mo)** in the dashboard,
add a disk mounted at `/data`, and set `DATA_DIR=/data` — no file editing needed.
(The durable-data limitation goes away entirely once we move to Postgres, Phase 1.)

## Option B — Docker (Fly.io, Railway, any container host)

A [`Dockerfile`](Dockerfile) is included (builds the frontend, runs the server).

```bash
docker build -t soilconnect .
docker run -p 3001:3001 -v soilconnect-data:/app/data soilconnect
```

The volume at `/app/data` (with `DATA_DIR=/app/data`, already set in the image)
keeps the datastore across container restarts. On Fly/Railway, attach a volume
to that path.

## Option C — any Node host (manual)

```bash
npm install
npm run build
NODE_ENV=production DATA_DIR=/var/lib/soilconnect node server.js
```

Put it behind a reverse proxy (nginx/Caddy) for HTTPS, or use the host's TLS.

---

## Environment variables

All optional for local dev (safe defaults). See [`.env.example`](.env.example)
for the full list. The ones that matter in production:

| Var | What | Recommended for beta |
|---|---|---|
| `NODE_ENV` | `production` enables serving `dist/` | `production` |
| `PORT` | port to listen on | injected by host (Render sets it) |
| `DATA_DIR` | directory for `data.json` (use a mounted disk) | `/data` (or volume path) |
| `APP_URL` | public URL, used in email links | your deployed URL |
| `REQUIRE_VERIFICATION` | force email verification on/off | `false` until SMTP is set |
| `CORS_ORIGIN` | allowed browser origins (comma-sep) | unset (single-origin needs none) |
| `SMTP_*`, `MAIL_FROM` | real email (see below) | unset until ready |

Because the frontend is served from the same origin as the API, **`CORS_ORIGIN`
is not needed** for the normal single-service setup. Only set it if you later
split the frontend onto a different domain.

---

## Email (notifications + verification + password reset)

The app sends transactional email (new request, accept/decline, new bid, award,
delivered, new message), the signup verification link, and password-reset links.

- **Without SMTP config:** it uses an **Ethereal test inbox** — nothing is really
  delivered; verification/reset links are returned in the API response and a
  preview URL is logged. In this mode the app **auto-verifies** new signups so
  testers aren't locked out. Good for a first beta.
- **To send real email:** set `SMTP_HOST`, `SMTP_PORT` (587 or 465), `SMTP_USER`,
  `SMTP_PASS`, and `MAIL_FROM`, then set `REQUIRE_VERIFICATION=true` to enforce
  verification. Any provider works (Resend, Postmark, SendGrid, Brevo/Mailjet, or
  Gmail with an app password for low volume).

---

## Billing / subscriptions

Free for everyone until a user-count threshold, then role-based plans (end users:
1 free post/month then a Poster sub; haulers: a flat sub to bid). All billing UI
is hidden while free.

- **Stays free** until `FREE_USER_THRESHOLD` accounts (default 100). Force paid
  mode with `BILLING_ENABLED=true`.
- Tunable via env: `FREE_USER_THRESHOLD`, `FREE_POSTS_PER_MONTH`, `ENDUSER_PRICE`,
  `HAULER_PRICE`, `BILLING_ENABLED`.
- **No card is charged yet.** `POST /api/billing/subscribe` is a stub. To go live:
  replace it with a **Stripe Checkout** session + a **Stripe webhook** that sets
  `account.subscription` on `checkout.session.completed` /
  `customer.subscription.updated|deleted`. All gating (402 `subscription_required`,
  metering, role plans) is already in place — only the payment seam is left.

---

## Already hardened

- Passwords scrypt-hashed; all routes auth-guarded with per-user scoping.
- Per-IP **rate limiting** on auth + write endpoints; JSON body size capped.
- **CORS** allowlist via env; **password reset** + **email verification** flows.

## Still recommended before opening wide

- Move the JSON store to **Postgres** (Phase 1) for concurrent-write safety.
- **Error monitoring** (e.g. Sentry) and uptime checks (Phase 4).
- Closed-beta **invite gating** + **Privacy Policy/Terms** (Phase 5).

See [BETA-ROADMAP.md](BETA-ROADMAP.md) for the full sequence.

---

## Local development

`npm run dev` runs Vite (frontend) and auto-spawns `server.js` (API) via a
dev-only plugin in `vite.config.js`; Vite proxies `/api` to port 3001. The
server exits quietly if its port is taken, so a double-start is safe. Data lives
in `data.json` (gitignored), written atomically and flushed on shutdown.
