# Deploying Site-Sync to Replit

The app is a Vite front end + a small Express API (with a JSON datastore). One
command runs both, so deployment is simple.

## Put it live (Replit)

1. Go to **replit.com** → **Create / Import** → **Import from a .zip file** and
   upload `Site-Sync-replit.zip`.
2. Click **Run**. Replit installs dependencies, then `npm run dev` starts Vite,
   which auto-starts the API server. The web preview opens automatically.
3. Sign up an account in the app and you're in. Open the app from another
   device/browser and you'll share the same data — that's the multi-user backend.

That's it. No API keys or external accounts required.

## How it runs

- `npm run dev` → `vite`. A dev-only Vite plugin (`vite.config.js`) spawns
  `server.js` (the API) on port 3001; Vite proxies `/api` to it. The server
  exits quietly if 3001 is already taken, so a double-start is safe.
- Data lives in `data.json` (gitignored), written atomically and flushed on
  shutdown.

## Data durability — important

- **On a normal Repl (Run button):** the filesystem persists, so `data.json`
  survives restarts. Good for testing and early users.
- **On a published Replit Deployment:** the filesystem can reset on each
  redeploy. Before relying on it for real customer data, move the store to a
  durable backend. The cleanest swap (no UI changes — only `db.js` + the few
  `server.js` handlers) is **Replit Database** (`@replit/database`, free,
  built-in) or Postgres/Supabase. The API surface is already isolated for this.

## Email (notifications + verification)

The app sends transactional emails (new request, accept/decline, new bid, award,
delivered, new message) and an account-verification link on signup.

- **Without config:** it uses an **Ethereal test inbox** — emails aren't really
  delivered; a preview URL is logged to the server console. Fine for testing.
- **To send real email:** set these env vars (Replit Secrets) and restart:
  - `SMTP_HOST`, `SMTP_PORT` (587 or 465), `SMTP_USER`, `SMTP_PASS`
  - `MAIL_FROM` (e.g. `SoilConnect <no-reply@yourdomain.com>`)
  - `APP_URL` (your deployed URL, so links in emails point to the right place)

  Any SMTP provider works (e.g. a free tier of Brevo/Mailjet/Resend-SMTP, or
  Gmail with an app password for low volume).

## Billing / subscriptions

Free for everyone until a user-count threshold, then role-based plans (end users:
1 free post/month then a Poster sub; haulers: a flat sub to bid).

- **Stays free** until `FREE_USER_THRESHOLD` accounts (default 100). Force paid
  mode anytime with `BILLING_ENABLED=true`.
- Tunable via env: `FREE_USER_THRESHOLD`, `FREE_POSTS_PER_MONTH`,
  `ENDUSER_PRICE`, `HAULER_PRICE`, `BILLING_ENABLED`.
- **No card is charged yet.** `POST /api/billing/subscribe` is a stub that marks
  the account active. To go live: replace that stub with a **Stripe Checkout**
  session and add a **Stripe webhook** that sets `account.subscription`
  (status/plan/currentPeriodEnd) on `checkout.session.completed` /
  `customer.subscription.updated|deleted`. All the gating (402 `subscription_required`,
  metering, role plans) is already in place — only the payment seam is left.

## Optional: AI assistant

`server.js` has an unused `/api/chat` endpoint. To enable it later, add an
`OPENAI_API_KEY` in Replit **Secrets**. The app runs fine without it.

## Security note (prototype)

Passwords are scrypt-hashed and routes are auth-guarded with per-user scoping.
Before a public launch, also add HTTPS-only cookies/session hardening and rate
limiting — standard production hardening beyond this prototype.
