# Session Changelog — Hardening & Geo Map

App: **SoilConnect** (Site-Sync) — soil marketplace (buyer ↔ seller ↔ hauler).
Run goal (per Alex): make it a solid, bug-free app + real Google Maps geo map + simulated login. No payments (subscription model). No backend yet.

Dev server runs locally on **http://localhost:5173** (port 5000 is taken by macOS Control Center).
Node 20 installed at `~/.local/node-v20.18.1-darwin-x64/bin` (no system Node).

---

## ✅ Done & verified (this hardening run)

- **Fixed unstyled core screens.** `.page`, `.page-header`, `.btn`, `.btn-primary`, `.input`, plus form-error classes were used by `SellerInquiryDetails` and `HaulerHaulOpportunity` but defined nowhere — those screens rendered as raw HTML. Added all classes to `App.css`. Verified live: the seller inquiry screen now renders proper glass cards + styled buttons.
- **Fixed app-wide console errors.** `src/index.jsx` called `createRoot()` unguarded (double-root on HMR → `removeChild` DOM errors) and had a `GlobalErrorPanel` debug scaffold that hijacked the screen on any window error. Replaced with a clean, single-root, production-shaped entry. Verified: console is now clean.
- **Hardened the ErrorBoundary.** Was a dead-end "open DevTools" dump; now has "Try again" + "Go to home" recovery actions and collapsible technical details.
- **Catch-all route added.** Unknown URLs previously rendered blank; now redirect to `/`.
- **Fixed unstable React keys.** `BuyerBrowseListings`, `ListingDetails`, `HaulerDashboard` used `Math.random()` in `key` (remount every render) — now stable index fallbacks.

## 🔁 In progress / next (autonomous run continues)

- **Bug sweep (Task #1):** a read-only audit subagent is combing all of `src/` for more correctness issues; findings will be folded in.
- **Simulated auth (Task #2):** AuthContext + validated Login/Signup + persistent local account + Profile wiring.
- **Real geo map (Task #3):** lat/lng on listings/requests/opportunities, address geocoding, Google Maps view replacing the placeholder. Built env-keyed with a graceful fallback.

## ⚠️ Needs Alex (not blocking the build)

- **Google Maps API key.** The map is built to read `VITE_GOOGLE_MAPS_API_KEY` from a `.env.local` file (gitignored). Until a key is added it shows a friendly "add your key" fallback. To activate: Google Cloud → enable **Maps JavaScript API** + **Geocoding API** → create an API key → put `VITE_GOOGLE_MAPS_API_KEY=...` in `.env.local` → restart the dev server.

## Earlier this session (already shipped)

Wired 6 orphaned routes; converted `BuyerListingDetails` from props to router; fixed the buyer→seller request loop (`inquiries` alias) and a hauler crash (`useHaulBid` export); built the seller→hauler accept→opportunity link; added listing edit/pause, buyer request details, message persistence + entry point; removed dead duplicates. Full buyer→seller→hauler loop verified live.
