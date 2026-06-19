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

## Optional: AI assistant

`server.js` has an unused `/api/chat` endpoint. To enable it later, add an
`OPENAI_API_KEY` in Replit **Secrets**. The app runs fine without it.

## Security note (prototype)

Passwords are scrypt-hashed and routes are auth-guarded with per-user scoping.
Before a public launch, also add HTTPS-only cookies/session hardening and rate
limiting — standard production hardening beyond this prototype.
