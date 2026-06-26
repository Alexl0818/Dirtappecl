# 🗺️ SoilConnect — Beta Launch Roadmap

A sequenced plan behind [BETA-LAUNCH-CHECKLIST.md](BETA-LAUNCH-CHECKLIST.md). The phases are
ordered by dependency: each unlocks the next. Items marked **[Claude]** I can do now without you;
items marked **[You]** need your credentials or a decision.

---

## The path to a live URL (critical path)

```
PHASE 0 (harden)  ──►  PHASE 2 (deploy)  ──►  SMTP (Phase 3)  ──►  PHASE 5 (gate + legal)  ──►  LIVE BETA
        │                                                              ▲
        └──────────────► PHASE 1 (Postgres) ──────────────────────────┘  (can land just after launch
                                                                          for a tiny closed beta)
```

PHASE 4 (monitoring) runs in parallel — wire it as soon as we have a deployed host.

---

## Phase 0 — Code hardening  ·  ~1 session  · mostly **[Claude]**
**Goal:** the code is safe to expose to strangers.
Why first: these are pure code changes with no external dependencies, and they remove the two
things that would lock real testers out (required verification with no email; no password reset).

1. **Verification toggle** — add `REQUIRE_VERIFICATION` env. When off (beta default until SMTP),
   new users are auto-verified so they can use the app immediately. **[Claude]**
2. **Password reset** — `forgot` → token email → `reset`. Reuses the existing email pipeline
   (logs the link to console in test mode, so it works even before real SMTP). **[Claude]**
3. **Rate limiting** — simple in-memory limiter on auth + post endpoints. **[Claude]**
4. **CORS lock** — read allowed origin from env; `*` only in dev. **[Claude]**
5. **Validation + error shape** — consistent `{ error }` responses, reject malformed bodies. **[Claude]**
6. **`.env.example`** — every knob documented in one place. **[Claude]**

**Exit criteria:** a stranger can sign up, log in, reset a forgotten password, and post — locally,
with no SMTP — and abusive request floods are throttled.

## Phase 1 — Production data layer  ·  ~1 session  · **[You decide]** then **[Claude]**
**Goal:** data survives concurrent users and restarts.
- **Decision point:** JSON file is fine for a 5–10 person invite beta. Beyond that, move to Postgres.
- If Postgres: I'll add a schema + a one-time migration that reads `data.json` and loads it in,
  keeping the same API so nothing else changes.
- Either way: a scheduled backup (file copy or `pg_dump`).

**Recommendation:** ship the closed beta on JSON to move fast, do the Postgres swap in parallel,
cut over before widening the beta.

## Phase 2 — Deployment  ·  ~1 session  ·  **[Claude]** builds config, **[You]** click deploy
**Goal:** a URL you can text to a tester.
- I'll add deploy config (Dockerfile + render.yaml or Procfile) and a production build setup that
  points the frontend at the live API.
- You create the host accounts and connect the repo (I can't provision those).
- We smoke-test the whole loop on the live URL together.

**Exit criteria:** the buyer→seller→hauler loop works end-to-end on `https://…`, not localhost.

## Phase 3 — Integrations  ·  **[You]** supply keys, **[Claude]** wires
**Goal:** real email; geocoding that won't throttle.
- **SMTP (required for launch):** any provider (Resend, Postmark, SendGrid, Gmail SMTP). You give
  me the host/user/pass; it's already coded to use them — drop-in.
- **Geocoder (optional):** Nominatim is fine for low beta traffic. Add a paid key only if testers
  hit throttling.
- **Stripe:** skip for now — beta is free; the billing engine stays hidden.

## Phase 4 — Observability  ·  ~½ session  ·  **[Claude]** + **[You]** for the Sentry key
**Goal:** you find out about bugs before testers complain.
- Error monitoring (Sentry free tier), server logging, a health/uptime ping.

## Phase 5 — Beta ops & legal  ·  ~½ session  ·  **[Claude]** drafts, **[You]** approve
**Goal:** controlled, lawful, friendly beta.
- Invite-code/allowlist gating so signups stay intentional.
- In-app feedback link.
- Basic Privacy Policy + Terms (you're collecting emails — these are needed).
- A short tester welcome guide.

---

## Suggested order of operations (what we actually do, session by session)
1. **Now:** Phase 0 items 1–6 (all code, no waiting on you).
2. **Next:** Phase 2 deploy config + Phase 5 drafts (legal/welcome) so they're ready.
3. **When you have an SMTP login + host accounts:** wire SMTP, deploy, smoke-test → **closed beta is live.**
4. **In parallel / right after:** Phase 1 Postgres swap + Phase 4 monitoring before widening.

I'll start at step 1 right now.
