# 🚀 SoilConnect — Beta Launch Checklist

> Print this and check items off as we go. Grouped by phase, in the order we'll tackle them.
> ☐ = not started · ◐ = in progress · ☑ = done

_Last updated: 2026-06-26_

---

## PHASE 0 — Code hardening (no accounts/credentials needed)

- [ ] Make email verification **non-blocking for beta** (env toggle so testers aren't locked out before real SMTP)
- [ ] **Password reset** flow ("forgot password" → email link → set new password)
- [ ] **Rate limiting** on public API (signup/login/post abuse protection)
- [ ] Lock down **CORS** to the real frontend domain (currently open to `*`)
- [ ] Server-side **input validation** pass on all write endpoints
- [ ] `.env.example` documenting every config value
- [ ] Friendly **404 / error pages** + API error shape consistency
- [ ] Confirm **data backups** strategy (even if just a daily file copy for now)

## PHASE 1 — Production data layer

- [ ] **Decision:** keep JSON file (tiny closed beta only) OR move to Postgres
- [ ] If Postgres: schema + migration from current JSON
- [ ] Seed/admin script for test accounts
- [ ] Automated backup (snapshot/dump on a schedule)

## PHASE 2 — Deployment (get a shareable URL)

- [ ] Pick hosts (e.g. Render/Railway/Fly for API, Vercel/Netlify for UI)
- [ ] **Backend** deploy config (Dockerfile / Procfile / render.yaml)
- [ ] **Frontend** build + deploy, pointed at production API URL
- [ ] Production **environment variables** set on hosts
- [ ] HTTPS + custom domain (optional but recommended)
- [ ] Smoke-test the full loop on the live URL

## PHASE 3 — Integrations (need your credentials)

- [ ] **Real SMTP** (transactional email — verification, resets, notifications)
- [ ] Geocoder: keep free Nominatim for beta OR add paid key (Google/Mapbox)
- [ ] Stripe — **NOT needed for free beta**; defer until paid phase

## PHASE 4 — Observability & safety

- [ ] **Error monitoring** (e.g. Sentry) so you see crashes testers hit
- [ ] Structured request/error **logging** on the server
- [ ] Basic **uptime check** / health ping
- [ ] (Optional) lightweight **analytics** (signups, posts, bids)

## PHASE 5 — Beta operations & legal

- [ ] **Closed-beta gating** (invite code or allowlist) so signups stay controlled
- [ ] **Feedback channel** (in-app link, form, or email)
- [ ] **Privacy policy** + **Terms of Service** (basic, required to collect emails)
- [ ] Short **"Welcome to the beta" guide** for testers
- [ ] Final pre-launch **smoke test** + go/no-go

---

## ✅ Definition of "ready for closed beta"
All of **Phase 0**, **Phase 2**, the **SMTP** item in Phase 3, plus **Phase 5** gating + feedback + privacy/terms.
Phase 1 (Postgres) and Phase 4 (monitoring) can trail slightly for a *small invite-only* group, but should land before opening it wider.
