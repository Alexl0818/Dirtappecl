# Site-Sync Backend Plan (blueprint — no code/accounts yet)

Goal: go from single-device localStorage prototype to a real **multi-user**
marketplace, where a buyer and seller on different devices see each other's data,
with real accounts and per-user data security. Keep the $10/mo subscription model
(low, predictable infra cost) and no payment processing for transactions.

---

## 1. Recommended stack: **Supabase**

Hosted Postgres + Auth + auto-generated APIs + Row-Level Security + a JS client.

**Why Supabase over the alternatives:**
- **Relational fit.** This marketplace is inherently relational —
  listings → requests → opportunities → bids, all linked by ids. Postgres models
  that cleanly (Firebase's NoSQL would fight it).
- **Auth included.** Real email/password accounts replace our simulated
  `AuthContext` with almost no glue code.
- **Row-Level Security (RLS).** The database itself enforces "buyers see their own
  requests, sellers see requests on their listings" — this is the #1 thing the
  prototype can't do (today everyone sees everything).
- **No server to run.** The browser talks to Supabase directly via the anon key;
  RLS keeps it safe. Fits a solo builder — no ops, no DevOps.
- **Cost.** Generous free tier; paid tier ~$25/mo flat. Predictable, fits the
  subscription model. (Realtime + storage included if we want them later.)
- **Realtime (bonus, later).** Sellers can see new requests / haulers see new
  bids live, with a one-line subscription.

Alternatives considered: **Firebase** (great, but NoSQL is a worse fit here);
**custom Node/Express + Postgres** (most control, most ops — not worth it now).

---

## 2. Data model (Postgres tables)

Mirrors the current localStorage stores almost 1:1.

| Today (localStorage)                         | Table            |
|----------------------------------------------|------------------|
| `dirtapp_accounts` / `dirtapp_auth_user`     | `auth.users` + `profiles` |
| `dirtapp_seller_listings`                    | `listings`       |
| `dirtapp_buyer_requests`                     | `requests`       |
| `dirtapp_haul_opportunities`                 | `opportunities`  |
| `dirtapp_haul_bids`                          | `bids`           |
| `dirtapp_messages`                           | `messages`       |

```
profiles
  id            uuid PK → auth.users.id
  name, company, phone, region   text
  roles         jsonb            -- { buyer, seller, hauler }
  created_at    timestamptz

listings
  id            uuid PK
  seller_id     uuid → profiles.id
  material, unit, location, notes, price   text
  quantity      numeric
  lat, lng      double precision           -- geocoded (Nominatim, client-side)
  status        text  -- active | paused
  created_at    timestamptz

requests
  id            uuid PK
  buyer_id      uuid → profiles.id
  listing_id    uuid → listings.id  (nullable: open requests)
  material, unit, address, notes   text
  quantity      numeric
  lat, lng      double precision
  status        text  -- open | accepted
  created_at    timestamptz

opportunities
  id              uuid PK
  listing_id      uuid → listings.id
  request_id      uuid → requests.id
  seller_id       uuid → profiles.id
  material, unit  text
  quantity        numeric
  pickup_lat/lng, dropoff_lat/lng   double precision
  pickup_text, dropoff_text          text
  status          text  -- open | awarded
  awarded_bid_id  uuid → bids.id (nullable)
  created_at      timestamptz

bids
  id              uuid PK
  opportunity_id  uuid → opportunities.id
  hauler_id       uuid → profiles.id
  amount          numeric
  availability, notes   text
  status          text  -- pending | awarded | rejected
  created_at      timestamptz

messages
  id           uuid PK
  thread_id    uuid          -- e.g. request_id or opportunity_id
  sender_id    uuid → profiles.id
  from_role    text          -- buyer | seller | hauler
  text         text
  created_at   timestamptz
```

---

## 3. Security (Row-Level Security) — the core upgrade

Enforced in the DB, so it's safe even though the browser talks to it directly:

- **profiles**: read public fields of anyone; write only your own.
- **listings**: any authenticated user reads `active` listings; only the owning
  seller inserts/updates/deletes their own.
- **requests**: the buyer sees their own; the seller sees requests on *their*
  listings. Only the buyer creates; only the seller updates status (accept).
- **opportunities**: the owning seller + any hauler can read; only the seller
  creates (on accept) and awards.
- **bids**: a hauler creates/reads their own; the seller who owns the opportunity
  reads all bids on it and sets the winner.
- **messages**: only the thread participants can read/write.

This is exactly the "per-user data" gap flagged in the session changelog.

---

## 4. Migration path (incremental, low-risk)

The five Contexts already **abstract data access** (`addListing`, `requests`,
`addRequest`, etc.). That's the key: we swap the *implementation* behind those
APIs from localStorage to Supabase, and the screens barely change.

1. **Set up** Supabase project, run schema SQL, enable + write RLS policies.
2. **Auth first.** Replace `AuthContext` internals with Supabase Auth, keeping the
   same `useAuth()` surface (`user`, `login`, `signup`, `logout`, `updateProfile`).
   The route guard + screens keep working unchanged.
3. **Listings next** (proving ground). Rewrite `SellerListingContext` to read/write
   the `listings` table (async). Add loading/error states.
4. **Requests**, then **opportunities + bids**, then **messages** — same pattern,
   one store at a time, each verified end-to-end before the next.
5. **Realtime (optional).** Add subscriptions so new requests/bids appear live.
6. **Geocoding unchanged** — stays client-side via Nominatim.

Each step is independently shippable; the app keeps working throughout.

---

## 5. What changes for you operationally

- **Env vars:** `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in `.env.local`
  (and in Replit Secrets). The anon key is safe in the client *because* of RLS.
- **Data doesn't auto-migrate.** Existing localStorage demo data won't carry over
  (fresh start, or I can write a one-time import). Real accounts replace simulated.
- **Offline.** We lose localStorage's offline capability (acceptable for a
  marketplace that's inherently online; could add caching later).

---

## 6. What I need from you to start

1. **Confirm Supabase** (vs. Firebase).
2. **Create the Supabase project** (free; it's your account) and paste the project
   URL + anon key — or, if you'd rather, I can drive you through it step by step.
3. **Scope:** migrate **auth + listings first** (recommended — prove the pattern,
   low risk), or go all-in across every store.

Once I have the URL + anon key and a thumbs-up on scope, I'll start with auth +
listings and verify multi-user behavior before moving on.

---

## 7. Rough effort

- Schema + RLS: ~half a phase
- Auth swap: ~1 phase
- Per store (listings / requests / opps+bids / messages): ~1 phase each
- Realtime polish: optional, later

Built and verified incrementally, store by store.
