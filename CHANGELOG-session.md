# Session Changelog — Hardening & Geo Map

## 🛡️ Error monitoring (Sentry) — wired, off by default (latest)

Added Sentry error monitoring for both ends, **completely inert unless a DSN is set**
(app runs identically without it):
- Backend: `instrument.js` (Sentry.init, imported before express in `server.js`) +
  `Sentry.setupExpressErrorHandler(app)`, gated on `SENTRY_DSN`.
- Frontend: `Sentry.init` in `src/index.jsx`, gated on build-time `VITE_SENTRY_DSN`.
- `@sentry/node` + `@sentry/react` v10 added to dependencies; `.env.example` documents
  both vars (same DSN value). `tracesSampleRate: 0` (error monitoring only, free-tier friendly).

To turn on: create a free Sentry project, then set `SENTRY_DSN` + `VITE_SENTRY_DSN` in
Render. Verified locally: with no DSN, server starts with no sentry line and the app
renders clean (no console errors) — true no-op.

## 🧑‍🤝‍🧑 Beta-launch prep — Phase 5 (legal, feedback, welcome)

The "ready to invite people" layer:
- **Privacy Policy** (`/privacy`) and **Terms of Service** (`/terms`) — plain-language
  beta templates (ECL Site Works LLC, contact alex@eclsite.com). Linked from the
  signup form ("By creating an account, you agree to our Terms and Privacy Policy")
  and from Profile.
- **In-app feedback channel** — `/feedback` screen → `POST /api/feedback`, which
  stores the note (`db.feedback`) AND emails it to the owner via the Brevo pipeline
  (`FEEDBACK_TO`, default alex@eclsite.com). Reachable from Profile and the welcome
  banner. 4000-char cap; empty rejected.
- **Beta welcome banner** — a dismissible note on the buyer home (persists via
  localStorage) explaining it's a beta and linking to feedback.

Verified live: both legal pages render with content; welcome banner shows + dismiss
works; feedback submits (200/ok), empty is rejected (400); console clean. Deploys
on the next GitHub push.

## 🔌 Configurable API base URL (phone-app ready)

The frontend no longer hardcodes where the API lives. `src/lib/api.js` reads a
build-time `VITE_API_URL`:
- **Unset (default):** uses a relative `/api` path — correct for the
  single-service web deploy (frontend + API share one address) and dev.
- **Set:** bakes in an absolute API URL (e.g. `https://soilconnect.onrender.com`)
  — what a future native phone-app build needs (it can't use a relative path).

Documented in `.env.example`. Verified both builds: default keeps `/api` with no
host leaked; with `VITE_API_URL` set, the absolute URL is baked into the bundle.
Re-verified the production server serves the freshly built app end-to-end
(homepage, client routes, assets, `/api/health`, and a clean 404 on unknown
`/api`). No product rules touched; third-party integrations remain env-keyed with
their graceful fallbacks.

## 📦 Beta-launch prep — Phase 2 deployment config

Made the app deployable as a **single service** (one URL, no CORS): in
production the Express server serves the built React app from `dist/` alongside
the `/api` routes, with an SPA fallback for client routes.

- `server.js` — reads `PORT` from env; serves `dist/` + SPA fallback when
  `NODE_ENV=production` (or `SERVE_STATIC=true`); `/api/*` still 404s cleanly
  (not swallowed by the fallback).
- `db.js` — datastore path now configurable via `DATA_DIR`/`DATA_FILE` so a
  mounted persistent disk survives redeploys (auto-creates the dir).
- Deploy config: [Dockerfile](Dockerfile) + [.dockerignore](.dockerignore),
  [render.yaml](render.yaml) blueprint (build + start + health check + 1GB disk),
  `npm start` script, `engines.node >=20`.
- [DEPLOY.md](DEPLOY.md) rewritten production-first (Render / Docker / any Node
  host); `.env.example` gains `NODE_ENV`, `PORT`, `DATA_DIR`, `SERVE_STATIC`.

Verified locally: `npm run build` → `NODE_ENV=production PORT=4000
DATA_DIR=/tmp/... node server.js` serves the app at `/`, client routes resolve,
assets load, `/api/health` ok, unknown `/api` 404s, and a signup persists to the
configured data dir without touching the real `data.json`.

## 🚀 Beta-launch prep — Phase 0 hardening

Added a printable [BETA-LAUNCH-CHECKLIST.md](BETA-LAUNCH-CHECKLIST.md) +
sequenced [BETA-ROADMAP.md](BETA-ROADMAP.md), then knocked out Phase 0 (all
code, no external accounts needed):

- **Verification toggle** — `REQUIRE_VERIFICATION` env. Defaults ON only when real
  SMTP is set, otherwise auto-verifies new signups so beta testers aren't locked
  out by an undeliverable link.
- **Password reset** — `forgot-password` → emailed (or, in no-SMTP beta, returned)
  reset link → `reset-password`. New `/forgot` + `/reset` screens, a "Forgot
  password?" link on login, 1-hour token expiry, and all sessions invalidated on
  reset. Verified end-to-end in the browser.
- **Rate limiting** — in-memory per-IP limiter: tight on auth (30/15min), looser on
  content creation (40/min). Returns 429 + Retry-After.
- **CORS lock** — origin allowlist from `CORS_ORIGIN` (reflects origin in dev).
- **Body-size cap** — JSON limited to 256kb (413 on oversize).
- **Config** — `.env.example` documents every knob; server auto-loads `.env`
  (zero-dependency, via a `load-env.js` side-effect import).

Verified live: signup auto-verifies, reset flow works UI + API, rate limit trips,
oversized bodies rejected, no-leak on unknown-email reset, console clean.

## 🧭 Removed role selection

Buyers/sellers/haulers are no longer separate roles. There's no "choose your role"
screen at login and no role picker in Profile — every signed-in user reaches all
flows (Buy / Sell / Haul) through the bottom nav. The only future gate is the
**hauler subscription** to submit bids once billing turns on (already enforced
server-side). Removed the `/mode` route + ModeSelectScreen, the Profile Roles card,
the dashboards' "Switch Mode" controls, and `roles` from signup + profile PATCH.
Login/Signup/Verify now land on `/buyer/home`. Verified live: login goes straight
into the app, Profile shows only Account + Contact, console clean.

## 💳 Subscription/billing engine

Wired the monetization model into the backend: **free for all until a user
threshold, then role-based plans** — end users get 1 free post/month then need a
Poster sub ($10–15); haulers need a flat Hauler sub ($250–400) to bid (filters
spam/undercutters). Gated actions return **402**; per-account subscription state;
monthly post metering; config via env. `POST /api/billing/subscribe` is a **stub**
(Stripe Checkout + webhooks drop in there — no card charged yet). Profile shows a
**Plan & billing** card (free-period note / active plan / subscribe / cancel).
Verified live: free mode unrestricted; paid mode gates 2nd post + hauler bids, and
subscribing unlocks. Default left in free mode (Phase 1). Config in `DEPLOY.md`.



## 📍 Tightened address entry (latest)

Addresses on listings + requests are now validated before posting: a reusable
`AddressField` geocodes on blur/Check, confirms the matched address inline (✓) or
shows a clear error, and **blocks submission until the address resolves**. No more
listings/requests saved without coordinates (which caused map gaps/no distance) or
non-empty-but-bogus addresses. Verified live on both forms.
(Trade-off: relies on the geocoder being reachable; with a paid geocoder in
production this is more robust than the free Nominatim used now.)



## ⭐ Hauler ratings (latest)

Buyers now rate the **hauler** after delivery too (not just the seller). Each
bidder's rating shows next to their bid in the seller's award view ("★ avg" or
"no ratings yet"), so awarding can weigh reliability, not just price. Reuses the
reviews store. Trust now covers all three parties (seller, hauler). Verified live.



## 📧 Email notifications + account verification (latest)

- **Transactional emails** on every key event (new request → seller,
  accept/decline → buyer, new bid → seller, award → hauler, delivered → buyer,
  new message → recipient). Pipeline (`email.js`, nodemailer) uses real SMTP when
  configured (env), else an Ethereal test inbox with logged preview URLs. Sends
  are best-effort/non-blocking.
- **Account email verification — REQUIRED:** signup emails a verify link;
  `/verify` page + endpoint confirm it. Unverified users hit a **VerifyGate**
  (can't use the app) and the server **rejects all writes** from unverified
  accounts (403 `unverified`) — reads/browsing stay open. When no mail provider
  is configured, the gate surfaces a one-click "Verify now" link so no one is
  stuck. Verified live: write blocked → verify → app unlocks.
- Config for real email is in `DEPLOY.md`. Verified live via Ethereal preview URLs.



## 🛡️ Polish & harden pass (latest)

Full code audit + live regression (no new features). Fixes:
- **Messaging authorization** (was the real gap): read/post now require thread
  participation; message role is derived server-side, never trusted from the client.
- **Body-trust hardening:** opportunity POST keeps server-controlled fields;
  PATCH listings/requests/opportunities whitelist patchable fields (no overwriting
  id/owner/createdAt); award validates the bid belongs to the opportunity.
- **Cleanups:** MessageThread guards send without a real thread + handles errors;
  removed misleading always-"No" Haul-Included row; dropped dead client-assigned
  request id/createdAt.
- **Audit-confirmed OK:** stable keys, no conditional hooks, effect cleanup,
  empty states, 5-tab BottomNav fits at 375px, no stray console logs.
- **Regression:** verified messaging (both directions + 403 for non-participants),
  PATCH whitelist (price updates, owner protected), and every role's main screens
  render clean. Console clean throughout.



## ⭐ Ratings & reviews (latest)

After a delivered order, buyers rate the seller (1–5 stars + comment). Ratings
aggregate per seller and show on Browse + Listing Details ("★ avg (count)") — a
trust signal at browse time. Reusable `StarRating`; `reviews` store; one review
per reviewer→seller→order (updatable). Verified live.

## 🔔 Notifications + full lifecycle

- **Nav notification badges:** Sell shows open buyer requests on your listings;
  Haul shows open opportunities you haven't bid on.
- **Delivered/completed lifecycle:** the winning hauler can "Mark delivered";
  the haul closes (open → awarded → completed) and everyone sees "Delivered"
  (buyer order tracking, requests list, hauler Your Bids). Lifecycle is now
  end-to-end: post → request → accept/decline → bid → award → delivered.

## 💬 Order tracking, two-way messaging, deploy prep

- **Buyer order tracking:** Request Details + the requests list now show the order
  state — Awaiting seller → Arranging hauler → Hauler assigned (with hauler name,
  price, availability). Server lets buyers see their request's opportunity + the
  awarded hauler.
- **Two-way messaging + Inbox:** new Messages inbox (Inbox tab) listing each
  conversation; `MessageThread` is role-aware so buyer *and* seller can send and
  reply; entry points on both sides. Verified live both directions.
- **Durable store:** atomic writes + flush-on-shutdown in `db.js`.
- **Deploy prep:** `DEPLOY.md`, one-command dev (Vite auto-starts the API), fresh
  Replit zip. (Durability caveat for published Deployments documented.)



## 🤝 Marketplace workflow features (post-backend)

Real two-sided workflow on top of the multi-user backend:
- **Counterparty identity:** "Posted by [seller]" on listings, "From: [buyer]" on
  requests, "Hauler: [name]" on bids (server-enriched, no stored duplication).
- **Request cancellation:** buyers can cancel an open request (Request Details).
- **Seller decline:** sellers can decline a request (status → declined).
- **Hauler "Your Bids / Jobs won":** hauler dashboard now has hauler-centric KPIs
  (open / your bids / jobs won), an Open-opportunities section, and a Your Bids
  list showing each bid's status (Pending / Won / Not selected) with route + amount.
All verified live; console clean. (Per-user scoping keeps each account's view to
its own data.)



## 🎨 UI CONSISTENCY — every screen now uses one design system

Brought all remaining raw/flat screens into the glass design language so the app
looks uniform end-to-end:
- **Landing pages uniform:** shared `.nav-card` (even height + hover), Mode Select
  rebuilt as glass cards, seller dashboard width matched to the others.
- **Welcome** rebuilt as a branded hero on the topo background.
- **Your Requests** + **Request Details**: glass cards, status pills, bottom nav.
- **Login** + **Signup**: glass card forms with dark inputs (were light forms).
- **Message thread**: glass cards, themed bubbles, styled composer.
All verified live (mobile + desktop), console clean throughout.



## 🚀 REAL BACKEND — Phase 1 (auth + listings) DONE & multi-user verified

The app is no longer single-device. Extended the existing Express server into a
real backend with a persistent JSON datastore (`db.js`) and token auth.

- `server.js`: REST API for auth/profile, listings, requests, opportunities,
  bids (+ atomic award), messages. Owner-scoped reads. Sessions via Bearer token.
  Passwords never returned to the client. Runs on :3001; Vite proxies `/api`.
- `src/lib/api.js`: client with token management.
- `AuthContext` + `SellerListingContext` rewritten to use the backend (same hook
  surface, so screens barely changed). Listing screens scope to the current
  seller; buyers browse all.
- **Verified live multi-user:** seller@site.com created a Boone, NC listing →
  persisted server-side (`data.json`, geocoded) → a *separate* buyer@site.com
  account in a fresh session saw it on Browse. Console clean.
- Data store (`data.json`) is gitignored.

## 🚀 REAL BACKEND — Phase 2 (full loop) DONE & multi-user verified

Moved requests, opportunities, and bids onto the backend too (InquiryContext +
HaulBidContext rewritten; atomic award via a dedicated server endpoint). Added
DELETE endpoints for the "clear" actions. Consumers updated to async
(BuyerRequest, SellerInquiryDetails accept/award, HaulerHaulOpportunity bid).

- **Verified live across THREE separate accounts:** buyer@site.com requests →
  seller@site.com sees + accepts → hauler@site.com bids → seller awards → hauler
  sees "Locked / Winner". Every step crossed the network through the shared store
  with correct per-user scoping. Console clean.
- The 3-account test caught a real bug: awarded opportunities dropped out of the
  hauler's view — fixed so haulers still see opps they've bid on.
- **Messages now on the backend too** (loaded per-thread on demand). Verified
  live: a seller's message persists server-side and reloads from the server when
  the thread is reopened. **No data store uses localStorage anymore** — only the
  session token does.
- **Password hashing added** (scrypt, built into Node — no deps). New signups are
  hashed; legacy plaintext accounts transparently upgrade to a hash on next login.
  Verified: new + legacy logins work, wrong passwords rejected, stored values are
  `scrypt$…`.
- **Per-resource write authorization tightened.** PATCH request/opportunity now
  enforce ownership. Verified: seller (owns listing) 200, unauthorized user 403,
  no token 401.

**Dev runs as one command:** Vite now auto-starts the API server via a dev-only
plugin (`vite.config.js`), so `npm run dev` (or just `vite`) boots both UI and
backend — no separate step. Server exits quietly if its port is already taken
(safe double-start). Same behavior locally and on Replit.



App: **SoilConnect** (Site-Sync) — soil marketplace (buyer ↔ seller ↔ hauler).
Run goal (per Alex): make it a solid, bug-free app + real Google Maps geo map + simulated login. No payments (subscription model). No backend yet.

Dev server runs locally on **http://localhost:5173** (port 5000 is taken by macOS Control Center).
Node 20 installed at `~/.local/node-v20.18.1-darwin-x64/bin` (no system Node).

---

## 🗺️ Geo map switched to free OpenStreetMap (no key needed)

Alex opted to switch from Google Maps to **Leaflet + OpenStreetMap** (free, no API
key, no billing) — Google required his account + billing, which can't be provisioned
for him. Done & **verified live**:
- `BuyerMapView` now renders a real Leaflet/OSM map with listing markers, popups
  ("View details"), and auto-fit-to-markers. Verified: tiles load, 2 markers from
  real geocoded listings, popup works, console clean. (Screenshots captured.)
- Geocoding switched to free **Nominatim**. Verified live: "Asheville, NC" geocoded
  to lat/lng on listing creation, marker appeared on the map.
- Removed `@vis.gl/react-google-maps` + the `APIProvider` wrapper + `.env.example`.
  No env key required anymore. Data model unchanged (`lat`/`lng`/`geoFormatted`), so
  Google can be swapped back later if ever wanted.

## 📍 Detail-page location maps (new)

The buyer listing-details page and the request-details page now show a small map
of the location (reusing `RouteMiniMap` with a single point). Only render when the
record has coordinates. Verified live (listing + request both show a marker).

## 🛣️ Pickup→dropoff route mini-map (new)

The hauler opportunity page now shows a small Leaflet map with pickup + dropoff
markers connected by a route line (reusable `RouteMiniMap` component; shared
`leafletSetup` for marker icons). Renders only when coords are present. Verified
live: Raleigh→Charlotte route drawn, console clean.

## 🔔 Seller request-count badges (new)

Each card on the seller's "Your Listings" page now shows the number of buyer
requests on its "View Requests (N)" button, so sellers see which listings have
activity without opening each. Verified live.

## 📊 Live KPI dashboards (new)

The three role landing pages were nav-cards only; now each shows at-a-glance live
counts (using the previously-unused `.kpi-*` styles): Seller → active listings /
buyer requests / awarded hauls; Buyer → your requests / listings available; Hauler →
open opportunities / bids placed / awarded. Verified live with real counts; console
clean. Also refreshed a couple of stale card descriptions (e.g. Map View).

## 🔎 Proximity search for buyers (new)

Browse Listings gained a "Near a location" field: type a city/zip/jobsite (or
"Use my location" via browser geolocation) and listings are measured + sorted
nearest-first, each showing "~N mi away". Serves the core buyer use case ("find
material near my jobsite"). Verified live: from Charlotte, Asheville listing (~99 mi)
sorts above Raleigh listing (~130 mi). Console clean.

## 📏 Distance-aware haul opportunities (new)

Builds on the geo data: haulers now see **haul distance** (pickup→dropoff), the key
driver of their bid. Haversine helper in `src/lib/maps.js`; opportunities capture
pickup/dropoff coords at accept time; distance shows on the hauler dashboard cards
and the opportunity detail page. Verified live: Raleigh→Charlotte listing/request
geocoded, accepted, hauler dashboard shows "~130 mi haul". Console clean.

## 🧪 Verified live this session (full coverage)

Complete loop, exercised in the running app with the auth guard + all fixes in place:
**sign up / log in → seller posts listing → buyer browses → listing details →
request (prefilled) → seller sees request → accept → haul opportunity created →
hauler places bid → seller awards bid → hauler side shows "Locked".** Auth guard
verified both directions (logged-out bounces to login, logged-in gets access).
Data persists across a dev-server restart. Console clean at every step.

## ✅ Done & verified (this hardening run)

- **Fixed unstyled core screens.** `.page`, `.page-header`, `.btn`, `.btn-primary`, `.input`, plus form-error classes were used by `SellerInquiryDetails` and `HaulerHaulOpportunity` but defined nowhere — those screens rendered as raw HTML. Added all classes to `App.css`. Verified live: the seller inquiry screen now renders proper glass cards + styled buttons.
- **Fixed app-wide console errors.** `src/index.jsx` called `createRoot()` unguarded (double-root on HMR → `removeChild` DOM errors) and had a `GlobalErrorPanel` debug scaffold that hijacked the screen on any window error. Replaced with a clean, single-root, production-shaped entry. Verified: console is now clean.
- **Hardened the ErrorBoundary.** Was a dead-end "open DevTools" dump; now has "Try again" + "Go to home" recovery actions and collapsible technical details.
- **Catch-all route added.** Unknown URLs previously rendered blank; now redirect to `/`.
- **Fixed unstable React keys.** `BuyerBrowseListings`, `ListingDetails`, `HaulerDashboard` used `Math.random()` in `key` (remount every render) — now stable index fallbacks.

- **Simulated auth (Task #2) — DONE & verified.** `AuthContext` (localStorage):
  signup/login/logout/updateProfile, email + password validation, duplicate-email
  guard; the session user never stores the password. `LoginScreen`/`SignupScreen`
  rebuilt with controlled inputs + inline errors + Enter-to-submit. `ProfileScreen`
  prefills from the account, saves name/company/phone/region/roles, logout, and a
  signed-out fallback. Verified live: signup, validation, wrong/right login, logout,
  profile save persisting across sessions.
- **Real geo map (Task #3) — BUILT (tiles pending your key).** `@vis.gl/react-google-maps`
  installed. `src/lib/maps.js` (key read from `VITE_GOOGLE_MAPS_API_KEY`, `geocodeAddress`,
  `hasCoords`). `<APIProvider>` mounts app-wide only when a key exists. Listings and
  requests now best-effort geocode on save (lat/lng stored; no-ops without a key).
  `BuyerMapView` rebuilt as a real Google Map with listing markers + info windows +
  "View details", and a clean setup fallback (with a textual listing list) when no key.
  `.env.example` documents setup. Verified live WITHOUT a key: fallback renders, publish
  still saves, console clean. The actual map-tile rendering needs your key to confirm.

- **Final regression pass (Task #4) — DONE.** After auth + map + entry-point
  changes, re-ran the entire loop live: buyer browse → request → seller accept →
  haul opportunity → hauler dashboard. All green, console clean. Map fallback
  screen verified (screenshot-confirmed).

- **Bug sweep (Task #1) — DONE.** Full read-only audit of `src/` (the first
  background agent died with a process restart; re-ran it foreground). Codebase
  came back clean overall — defensive guards, no import/export mismatches, no
  unstable keys, all routes resolve. Acted on the real findings:
  - **(HIGH)** `SellerInquiryDetails`: the "no accepted request" branch could
    surface a haul opportunity + bids for a listing with no accepted request
    (listingId fallback). Now returns null unless a request is accepted.
  - **(hardening)** Added a `ready` guard to all four data contexts (Inquiry,
    SellerListing, HaulBid, Message) so the save effect can't write empty initial
    state over stored data — matches AuthContext. Verified: data survives restart.
  - **(MEDIUM)** Added a `RequireAuth` route guard — `/mode` and all
    buyer/seller/hauler/profile/messages routes redirect to `/login` when signed
    out. Verified: logged-out → login; logged-in → access; console clean.
  - Made `geocodeAddress` load the geocoding library on demand so it works with
    a key regardless of init order.
  - Audit non-issues (acknowledged, no action): bare `confirm()` (browser-safe),
    one-directional MessageThread (no buyer composer yet) — product gaps, not bugs.

## 🔁 Still open

- **Per-user data:** listings/requests are global in localStorage (any signed-in
  user sees all). Real per-account scoping is a backend concern (next milestone).

## ⚠️ Needs Alex

- Nothing required for the map anymore — it's free OpenStreetMap, works out of the
  box. (You'll just sign up in your browser to get past the login gate.)

## Earlier this session (already shipped)

Wired 6 orphaned routes; converted `BuyerListingDetails` from props to router; fixed the buyer→seller request loop (`inquiries` alias) and a hauler crash (`useHaulBid` export); built the seller→hauler accept→opportunity link; added listing edit/pause, buyer request details, message persistence + entry point; removed dead duplicates. Full buyer→seller→hauler loop verified live.
