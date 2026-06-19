# Session Changelog — Hardening & Geo Map

App: **SoilConnect** (Site-Sync) — soil marketplace (buyer ↔ seller ↔ hauler).
Run goal (per Alex): make it a solid, bug-free app + real Google Maps geo map + simulated login. No payments (subscription model). No backend yet.

Dev server runs locally on **http://localhost:5173** (port 5000 is taken by macOS Control Center).
Node 20 installed at `~/.local/node-v20.18.1-darwin-x64/bin` (no system Node).

---

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

- **Map tiles:** add a Google Maps key (`.env.local`) to see the live map render.
- **Per-user data:** listings/requests are global in localStorage (any signed-in
  user sees all). Real per-account scoping is a backend concern (next milestone).

## ⚠️ Needs Alex (not blocking the build)

- **Google Maps API key.** The map is built to read `VITE_GOOGLE_MAPS_API_KEY` from a `.env.local` file (gitignored). Until a key is added it shows a friendly "add your key" fallback. To activate: Google Cloud → enable **Maps JavaScript API** + **Geocoding API** → create an API key → put `VITE_GOOGLE_MAPS_API_KEY=...` in `.env.local` → restart the dev server.

## Earlier this session (already shipped)

Wired 6 orphaned routes; converted `BuyerListingDetails` from props to router; fixed the buyer→seller request loop (`inquiries` alias) and a hauler crash (`useHaulBid` export); built the seller→hauler accept→opportunity link; added listing edit/pause, buyer request details, message persistence + entry point; removed dead duplicates. Full buyer→seller→hauler loop verified live.
