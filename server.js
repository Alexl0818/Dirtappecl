import './load-env.js'; // must be first — loads .env before any env-reading module
import './instrument.js'; // Sentry init — must come before express so it can instrument it
import * as Sentry from '@sentry/node';
import express from 'express';
import crypto from 'crypto';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import OpenAI from 'openai';
import { data, save } from './db.js';
import { sendMail, APP_URL, EMAIL_TEST_MODE } from './email.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json({ limit: '256kb' })); // cap body size — reject oversized payloads

// Allowed browser origins. In production set CORS_ORIGIN to your frontend URL(s),
// comma-separated. Left unset (dev), we reflect the request origin so the local
// Vite dev server works. A literal "*" keeps the old wide-open behavior.
const CORS_ORIGINS = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (CORS_ORIGINS.length === 0) {
    // Dev: no allowlist configured — reflect the caller's origin.
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  } else if (CORS_ORIGINS.includes('*') || (origin && CORS_ORIGINS.includes(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

/* ------------------------------------------------------------------ *
 * Rate limiting (in-memory, per-IP). Lightweight protection against
 * brute-force and request floods. For multi-instance production this
 * should move to a shared store (e.g. Redis), but it's solid for a
 * single-instance beta.
 * ------------------------------------------------------------------ */
function rateLimit({ windowMs, max, key = 'default' }) {
  const hits = new Map(); // ip -> { count, resetAt }
  return (req, res, next) => {
    const now = Date.now();
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    const id = `${key}:${ip}`;
    let rec = hits.get(id);
    if (!rec || rec.resetAt < now) {
      rec = { count: 0, resetAt: now + windowMs };
      hits.set(id, rec);
    }
    rec.count += 1;
    if (rec.count > max) {
      const retry = Math.ceil((rec.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retry));
      return res.status(429).json({ error: `Too many requests. Try again in ${retry}s.` });
    }
    // Opportunistic cleanup so the map can't grow without bound.
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k);
    }
    next();
  };
}

// Tight limit on auth endpoints (brute-force / spam-signup defense); looser
// limit on content creation; a generous catch-all on everything else.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, key: 'auth' });
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 40, key: 'write' });

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

const newId = (prefix) => `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || '').trim());

// Keep only whitelisted keys from a body — prevents clients from overwriting
// server-controlled fields (id, owner, createdAt, status, …) via PATCH.
const pick = (obj, keys) => {
  const out = {};
  for (const k of keys) if (obj && k in obj) out[k] = obj[k];
  return out;
};

// Password hashing (scrypt, built into Node — no dependencies).
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored) return false;
  if (stored.startsWith('scrypt$')) {
    const [, salt, hash] = stored.split('$');
    const test = crypto.scryptSync(String(password), salt, 64).toString('hex');
    const a = Buffer.from(hash, 'hex');
    const b = Buffer.from(test, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }
  // Legacy plaintext (pre-hashing accounts) — compared directly, then upgraded.
  return stored === password;
}

// Strip secrets before sending an account to the client.
function publicUser(account) {
  if (!account) return null;
  const { password, verifyToken, resetToken, resetTokenExp, ...rest } = account;
  if (isAdmin(rest.email)) rest.isAdmin = true;
  return rest;
}

// Read-time enrichment: attach the counterparty's display name/company so the
// UI can show who you're dealing with (without duplicating it in storage).
function ratingFor(email) {
  const rs = data.reviews.filter((r) => r.toEmail === email);
  if (!rs.length) return { avg: 0, count: 0 };
  const avg = rs.reduce((s, r) => s + Number(r.rating || 0), 0) / rs.length;
  return { avg: Math.round(avg * 10) / 10, count: rs.length };
}
function withSeller(l) {
  const a = data.accounts[l.sellerEmail];
  const r = ratingFor(l.sellerEmail);
  return {
    ...l,
    sellerName: a?.name || "",
    sellerCompany: a?.company || "",
    sellerRating: r.avg,
    sellerRatingCount: r.count,
  };
}
function withBuyer(r) {
  const a = data.accounts[r.buyerEmail];
  return { ...r, buyerName: a?.name || "", buyerCompany: a?.company || "" };
}
function withHauler(b) {
  const a = data.accounts[b.haulerEmail];
  const r = ratingFor(b.haulerEmail);
  return {
    ...b,
    haulerName: a?.name || "",
    haulerCompany: a?.company || "",
    haulerRating: r.avg,
    haulerRatingCount: r.count,
  };
}
// Attach the winning hauler + bid summary to an awarded opportunity so buyers
// and sellers can see who's assigned without reading the bids list.
function withAwarded(o) {
  if (!o.awardedBidId) return o;
  const bid = data.bids.find((b) => String(b.id) === String(o.awardedBidId));
  if (!bid) return o;
  const a = data.accounts[bid.haulerEmail];
  return {
    ...o,
    awardedHaulerName: a?.name || "",
    awardedHaulerCompany: a?.company || "",
    awardedHaulerEmail: bid.haulerEmail || "",
    awardedAmount: bid.amount,
    awardedAvailability: bid.availability || "",
  };
}

// Pulls the signed-in user's email from the Bearer token; null if not valid.
function emailFromReq(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  return data.sessions[token] || null;
}

// Express middleware: require a valid session, attach req.userEmail.
function requireAuth(req, res, next) {
  const email = emailFromReq(req);
  if (!email || !data.accounts[email]) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  // A suspended account's existing session is immediately dead.
  if (data.accounts[email].suspended) {
    return res.status(403).json({ error: 'This account has been suspended.', code: 'suspended' });
  }
  req.userEmail = email;
  next();
}

// Whether new users must confirm their email before they can act. Defaults to
// ON only when real SMTP is configured — otherwise (beta/test mode with no mail
// provider) we auto-verify so testers aren't locked out by an undeliverable
// link. Force either way with REQUIRE_VERIFICATION=true|false.
const REQUIRE_VERIFICATION =
  process.env.REQUIRE_VERIFICATION != null
    ? process.env.REQUIRE_VERIFICATION === 'true'
    : !EMAIL_TEST_MODE;

// Gate write actions behind a verified email (use after requireAuth).
function requireVerified(req, res, next) {
  if (!REQUIRE_VERIFICATION) return next(); // beta: verification not enforced
  if (!data.accounts[req.userEmail]?.verified) {
    return res.status(403).json({
      error: 'Please verify your email before doing that.',
      code: 'unverified',
    });
  }
  next();
}

// Admin accounts get full moderation power (delete ANY post, not just their own)
// and see the /admin overview. Comma-separated emails; defaults to the owner.
const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS || 'alex@eclsite.com')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
);
function isAdmin(email) {
  return !!email && ADMIN_EMAILS.has(String(email).toLowerCase());
}
// Gate admin-only routes (use after requireAuth).
function requireAdmin(req, res, next) {
  if (!isAdmin(req.userEmail)) {
    return res.status(403).json({ error: 'Admins only.' });
  }
  next();
}

/* ------------------------------------------------------------------ *
 * Billing / subscriptions
 *
 * Free for everyone until a user-count threshold, then role-based:
 *  - end users (buyers/sellers): 1 free post/month, then a subscription
 *  - haulers: a flat subscription to place any bids
 * Real charging is done by Stripe later (see /api/billing/subscribe stub).
 * ------------------------------------------------------------------ */

const BILLING = {
  threshold: Number(process.env.FREE_USER_THRESHOLD || 100),
  forceEnabled: process.env.BILLING_ENABLED === 'true',
  freePostsPerMonth: Number(process.env.FREE_POSTS_PER_MONTH || 1),
  enduserPrice: process.env.ENDUSER_PRICE || '$10–15/mo',
  haulerPrice: process.env.HAULER_PRICE || '$250–400/mo',
};

const accountCount = () => Object.keys(data.accounts).length;
// Paid mode kicks in once we pass the free-user threshold (or via env override).
const billingActive = () => BILLING.forceEnabled || accountCount() >= BILLING.threshold;

function isSubscribed(account, plan) {
  const s = account?.subscription;
  if (!s || s.status !== 'active') return false;
  if (plan && s.plan !== plan) return false;
  if (s.currentPeriodEnd && new Date(s.currentPeriodEnd) < new Date()) return false;
  return true;
}

const monthKey = (d = new Date()) => `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`;
function postsThisMonth(email) {
  const mk = monthKey();
  const inMonth = (ts) => {
    try { return monthKey(new Date(ts)) === mk; } catch { return false; }
  };
  const listings = data.listings.filter((x) => x.sellerEmail === email && inMonth(x.createdAt)).length;
  const requests = data.requests.filter((x) => x.buyerEmail === email && inMonth(x.createdAt)).length;
  return listings + requests;
}

// End-user posting gate: free until the monthly allowance, then needs a sub.
function requireCanPost(req, res, next) {
  if (!billingActive()) return next();
  const account = data.accounts[req.userEmail];
  if (isSubscribed(account, 'enduser')) return next();
  if (postsThisMonth(req.userEmail) >= BILLING.freePostsPerMonth) {
    return res.status(402).json({
      error: `You've used your free post for this month. Subscribe (${BILLING.enduserPrice}) to post more.`,
      code: 'subscription_required',
      plan: 'enduser',
    });
  }
  next();
}

// Hauler bidding gate: a hauler subscription is required to bid at all.
function requireHaulerPlan(req, res, next) {
  if (!billingActive()) return next();
  if (isSubscribed(data.accounts[req.userEmail], 'hauler')) return next();
  return res.status(402).json({
    error: `A hauler subscription (${BILLING.haulerPrice}) is required to place bids.`,
    code: 'subscription_required',
    plan: 'hauler',
  });
}

/* ------------------------------------------------------------------ *
 * Auth + profile
 * ------------------------------------------------------------------ */

app.post('/api/auth/signup', authLimiter, (req, res) => {
  const { name, email, password, company } = req.body || {};
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!name || !name.trim()) return res.status(400).json({ error: 'Please enter your name.' });
  if (!isEmail(cleanEmail)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  if (data.accounts[cleanEmail]) return res.status(409).json({ error: 'An account with that email already exists.' });

  const verifyToken = crypto.randomBytes(24).toString('hex');
  const account = {
    name: name.trim(),
    email: cleanEmail,
    password: hashPassword(password),
    company: (company || '').trim(),
    phone: '',
    region: '',
    // Auto-verify when verification isn't enforced (beta with no SMTP) so the
    // user can act immediately and isn't stuck on an undeliverable link.
    verified: !REQUIRE_VERIFICATION,
    verifyToken: REQUIRE_VERIFICATION ? verifyToken : undefined,
    subscription: { status: 'none', plan: null, currentPeriodEnd: null },
    createdAt: new Date().toISOString(),
  };
  data.accounts[cleanEmail] = account;
  const token = crypto.randomUUID();
  data.sessions[token] = cleanEmail;
  save();
  res.json({ user: publicUser(account), token });

  if (REQUIRE_VERIFICATION) sendVerificationEmail(account);
});

// Sends (or re-sends) the email-verification link for an account.
function sendVerificationEmail(account) {
  if (!account || account.verified || !account.verifyToken) return;
  sendMail({
    to: account.email,
    subject: "Verify your HaulYard email",
    text: `Welcome to HaulYard, ${account.name}!\n\nConfirm your email to get the verified badge:\n${APP_URL}/verify?token=${account.verifyToken}`,
  });
}

// Confirm an email via the link's token (no auth — the token authenticates).
app.get('/api/auth/verify', (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Missing token.' });
  const account = Object.values(data.accounts).find((a) => a.verifyToken === token);
  if (!account) {
    return res.status(400).json({ error: 'Invalid or already-used verification link.' });
  }
  account.verified = true;
  delete account.verifyToken;
  save();
  res.json({ ok: true, email: account.email });
});

// Re-send the verification email to the signed-in user.
app.post('/api/auth/resend-verification', requireAuth, (req, res) => {
  const account = data.accounts[req.userEmail];
  if (account.verified) return res.json({ ok: true, alreadyVerified: true });
  if (!account.verifyToken) account.verifyToken = crypto.randomBytes(24).toString('hex');
  save();
  sendVerificationEmail(account);
  const resp = { ok: true };
  // No real mail provider -> hand the link back so the user isn't stuck.
  if (EMAIL_TEST_MODE) resp.verifyUrl = `${APP_URL}/verify?token=${account.verifyToken}`;
  res.json(resp);
});

const RESET_TTL_MS = 60 * 60 * 1000; // password-reset links live for 1 hour

// Request a password reset. Always responds ok (never reveals whether an account
// exists). If the email matches, mints a short-lived token and emails the link;
// with no mail provider the link is returned so the flow still works in beta.
app.post('/api/auth/forgot-password', authLimiter, (req, res) => {
  const cleanEmail = String(req.body?.email || '').trim().toLowerCase();
  const account = isEmail(cleanEmail) ? data.accounts[cleanEmail] : null;
  const resp = { ok: true };
  if (account) {
    account.resetToken = crypto.randomBytes(24).toString('hex');
    account.resetTokenExp = new Date(Date.now() + RESET_TTL_MS).toISOString();
    save();
    const link = `${APP_URL}/reset?token=${account.resetToken}`;
    sendMail({
      to: account.email,
      subject: 'Reset your HaulYard password',
      text: `Hi ${account.name},\n\nReset your password with the link below (valid for 1 hour):\n${link}\n\nIf you didn't request this, you can ignore this email.`,
    });
    // No real mail provider -> hand the link back so the user isn't stuck.
    if (EMAIL_TEST_MODE) resp.resetUrl = link;
  }
  res.json(resp);
});

// Complete a password reset using the emailed token (no auth — token authenticates).
app.post('/api/auth/reset-password', authLimiter, (req, res) => {
  const { token, password } = req.body || {};
  if (!token) return res.status(400).json({ error: 'Missing reset token.' });
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }
  const account = Object.values(data.accounts).find((a) => a.resetToken === token);
  if (!account || !account.resetTokenExp || new Date(account.resetTokenExp) < new Date()) {
    return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
  }
  account.password = hashPassword(password);
  delete account.resetToken;
  delete account.resetTokenExp;
  // Invalidate every existing session for this account — a reset should log out
  // any other devices (and anyone who may have had the old password).
  for (const [tok, email] of Object.entries(data.sessions)) {
    if (email === account.email) delete data.sessions[tok];
  }
  save();
  res.json({ ok: true });
});

app.post('/api/auth/login', authLimiter, (req, res) => {
  const { email, password } = req.body || {};
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!isEmail(cleanEmail)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  const account = data.accounts[cleanEmail];
  if (!account || !verifyPassword(password, account.password)) {
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  }
  if (account.suspended) {
    return res.status(403).json({ error: 'This account has been suspended. Contact support.' });
  }
  // Transparently upgrade any legacy plaintext password to a hash on login.
  if (!account.password.startsWith('scrypt$')) {
    account.password = hashPassword(password);
  }
  const token = crypto.randomUUID();
  data.sessions[token] = cleanEmail;
  save();
  res.json({ user: publicUser(account), token });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (token) delete data.sessions[token];
  save();
  res.json({ ok: true });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(data.accounts[req.userEmail]) });
});

app.patch('/api/profile', requireAuth, (req, res) => {
  const account = data.accounts[req.userEmail];
  const { name, company, phone, region } = req.body || {};
  if (name !== undefined) account.name = name;
  if (company !== undefined) account.company = company;
  if (phone !== undefined) account.phone = phone;
  if (region !== undefined) account.region = region;
  save();
  res.json({ user: publicUser(account) });
});

/* ------------------------------------------------------------------ *
 * Listings
 * ------------------------------------------------------------------ */

app.get('/api/listings', requireAuth, (req, res) => {
  // Everyone signed in can browse all listings.
  res.json(data.listings.map(withSeller));
});

app.post('/api/listings', writeLimiter, requireAuth, requireVerified, requireCanPost, (req, res) => {
  const b = req.body || {};
  const listing = {
    id: newId('lst'),
    sellerEmail: req.userEmail,
    createdAt: new Date().toISOString(),
    status: 'active',
    material: b.material ?? '',
    quantity: b.quantity,
    unit: b.unit ?? '',
    location: b.location ?? '',
    price: b.price ?? '',
    notes: b.notes ?? '',
    lat: b.lat,
    lng: b.lng,
    geoFormatted: b.geoFormatted,
  };
  data.listings.unshift(listing);
  save();
  res.json(listing);
});

app.patch('/api/listings/:id', requireAuth, requireVerified, (req, res) => {
  const l = data.listings.find((x) => String(x.id) === String(req.params.id));
  if (!l) return res.status(404).json({ error: 'Listing not found.' });
  if (l.sellerEmail && l.sellerEmail !== req.userEmail) {
    return res.status(403).json({ error: 'Not your listing.' });
  }
  Object.assign(
    l,
    pick(req.body, [
      "material",
      "quantity",
      "unit",
      "location",
      "price",
      "notes",
      "lat",
      "lng",
      "geoFormatted",
      "status",
    ])
  );
  save();
  res.json(l);
});

app.delete('/api/listings/:id', requireAuth, requireVerified, (req, res) => {
  const idx = data.listings.findIndex((x) => String(x.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Listing not found.' });
  if (
    data.listings[idx].sellerEmail &&
    data.listings[idx].sellerEmail !== req.userEmail &&
    !isAdmin(req.userEmail)
  ) {
    return res.status(403).json({ error: 'Not your listing.' });
  }
  data.listings.splice(idx, 1);
  save();
  res.json({ ok: true });
});

/* ------------------------------------------------------------------ *
 * Requests (buyer inquiries)
 * ------------------------------------------------------------------ */

// Visible: your own requests + requests on listings you own.
app.get('/api/requests', requireAuth, (req, res) => {
  const myListingIds = new Set(
    data.listings.filter((l) => l.sellerEmail === req.userEmail).map((l) => String(l.id))
  );
  const visible = data.requests.filter(
    (r) => r.buyerEmail === req.userEmail || myListingIds.has(String(r.listingId))
  );
  res.json(visible.map(withBuyer));
});

app.post('/api/requests', writeLimiter, requireAuth, requireVerified, requireCanPost, (req, res) => {
  const b = req.body || {};
  const request = {
    id: newId('req'),
    buyerEmail: req.userEmail,
    createdAt: new Date().toISOString(),
    status: 'open',
    material: b.material ?? '',
    quantity: b.quantity,
    unit: b.unit ?? '',
    address: b.address ?? '',
    notes: b.notes ?? '',
    listingId: b.listingId ?? null,
    lat: b.lat,
    lng: b.lng,
    geoFormatted: b.geoFormatted,
  };
  data.requests.unshift(request);
  save();
  res.json(request);

  // Notify the listing's seller.
  const listing = data.listings.find((l) => String(l.id) === String(request.listingId));
  if (listing?.sellerEmail) {
    const buyer = data.accounts[req.userEmail];
    sendMail({
      to: listing.sellerEmail,
      subject: "New request on your listing",
      text: `${buyer?.name || "A buyer"} requested ${request.quantity} ${request.unit} of ${request.material} (deliver to ${request.address || "—"}).\n\nReview it: ${APP_URL}/seller/listing`,
    });
  }
});

app.patch('/api/requests/:id', requireAuth, requireVerified, (req, res) => {
  const r = data.requests.find((x) => String(x.id) === String(req.params.id));
  if (!r) return res.status(404).json({ error: 'Request not found.' });
  // The buyer who made it, or the seller who owns the listing, may update it.
  const ownsListing = data.listings.some(
    (l) => String(l.id) === String(r.listingId) && l.sellerEmail === req.userEmail
  );
  if (r.buyerEmail !== req.userEmail && !ownsListing) {
    return res.status(403).json({ error: 'Not allowed to update this request.' });
  }
  const prevStatus = r.status;
  Object.assign(r, pick(req.body, ["status", "notes"]));
  save();
  res.json(r);

  // Notify the buyer when the seller accepts/declines.
  if (r.status !== prevStatus && (r.status === "accepted" || r.status === "declined")) {
    sendMail({
      to: r.buyerEmail,
      subject: `Your request was ${r.status}`,
      text: `Your request for ${r.quantity} ${r.unit} of ${r.material} was ${r.status} by the seller.\n\nView it: ${APP_URL}/buyer/requests`,
    });
  }
});

app.delete('/api/requests/:id', requireAuth, requireVerified, (req, res) => {
  const idx = data.requests.findIndex((x) => String(x.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Request not found.' });
  if (
    data.requests[idx].buyerEmail &&
    data.requests[idx].buyerEmail !== req.userEmail &&
    !isAdmin(req.userEmail)
  ) {
    return res.status(403).json({ error: 'Not your request.' });
  }
  data.requests.splice(idx, 1);
  save();
  res.json({ ok: true });
});

/* ------------------------------------------------------------------ *
 * Opportunities + bids
 * ------------------------------------------------------------------ */

// Visible: open opportunities (for haulers) + your own (as seller) + any you've
// bid on (so a hauler still sees the outcome after it's awarded).
app.get('/api/opportunities', requireAuth, (req, res) => {
  const myBidOppIds = new Set(
    data.bids.filter((b) => b.haulerEmail === req.userEmail).map((b) => String(b.oppId))
  );
  // Buyers should see the opportunity created from their own request.
  const myRequestIds = new Set(
    data.requests.filter((r) => r.buyerEmail === req.userEmail).map((r) => String(r.id))
  );
  const visible = data.opportunities.filter(
    (o) =>
      o.status === 'open' ||
      o.sellerEmail === req.userEmail ||
      myBidOppIds.has(String(o.id)) ||
      myRequestIds.has(String(o.requestId))
  );
  res.json(visible.map(withAwarded));
});

app.post('/api/opportunities', requireAuth, requireVerified, (req, res) => {
  const b = req.body || {};
  const opp = {
    ...b, // client-supplied listing/request details + coords
    id: newId('opp'),
    sellerEmail: req.userEmail, // server-controlled fields win
    createdAt: new Date().toISOString(),
    status: 'open',
    awardedBidId: null,
  };
  data.opportunities.unshift(opp);
  save();
  res.json(opp);
});

app.patch('/api/opportunities/:id', requireAuth, requireVerified, (req, res) => {
  const o = data.opportunities.find((x) => String(x.id) === String(req.params.id));
  if (!o) return res.status(404).json({ error: 'Opportunity not found.' });
  if (o.sellerEmail && o.sellerEmail !== req.userEmail) {
    return res.status(403).json({ error: 'Not your opportunity.' });
  }
  Object.assign(o, pick(req.body, ["status", "notes"]));
  save();
  res.json(o);
});

// Atomic award: mark the opp awarded + winning bid awarded + others rejected.
app.post('/api/opportunities/:id/award', requireAuth, requireVerified, (req, res) => {
  const o = data.opportunities.find((x) => String(x.id) === String(req.params.id));
  if (!o) return res.status(404).json({ error: 'Opportunity not found.' });
  if (o.sellerEmail && o.sellerEmail !== req.userEmail) {
    return res.status(403).json({ error: 'Not your opportunity.' });
  }
  const { bidId } = req.body || {};
  const winning = data.bids.find(
    (b) => String(b.id) === String(bidId) && String(b.oppId) === String(o.id)
  );
  if (!winning) {
    return res.status(400).json({ error: 'Bid not found for this opportunity.' });
  }
  o.status = 'awarded';
  o.awardedBidId = bidId;
  data.bids.forEach((b) => {
    if (String(b.oppId) !== String(o.id)) return;
    b.status = String(b.id) === String(bidId) ? 'awarded' : 'rejected';
  });
  save();
  res.json({ opportunity: o, bids: data.bids.filter((b) => String(b.oppId) === String(o.id)) });

  // Notify the winning hauler.
  if (winning.haulerEmail) {
    sendMail({
      to: winning.haulerEmail,
      subject: "Your bid was awarded 🎉",
      text: `You won the haul for ${o.material} (${o.pickupLocation || o.pickup || "pickup"} → ${o.dropoffAddress || o.dropoff || "dropoff"}) at $${winning.amount}.\n\nView it: ${APP_URL}/hauler/dashboard`,
    });
  }
});

// Mark an awarded haul as delivered/completed. Allowed for the seller who owns
// the opportunity or the awarded hauler.
app.post('/api/opportunities/:id/complete', requireAuth, requireVerified, (req, res) => {
  const o = data.opportunities.find((x) => String(x.id) === String(req.params.id));
  if (!o) return res.status(404).json({ error: 'Opportunity not found.' });
  if (o.status !== 'awarded') {
    return res.status(400).json({ error: 'Only an awarded haul can be completed.' });
  }
  const awardedBid = data.bids.find((b) => String(b.id) === String(o.awardedBidId));
  const isSeller = o.sellerEmail === req.userEmail;
  const isAwardedHauler = awardedBid && awardedBid.haulerEmail === req.userEmail;
  if (!isSeller && !isAwardedHauler) {
    return res.status(403).json({ error: 'Not allowed to complete this haul.' });
  }
  o.status = 'completed';
  o.completedAt = new Date().toISOString();
  save();
  res.json(o);

  // Notify the buyer their order was delivered.
  const request = data.requests.find((r) => String(r.id) === String(o.requestId));
  if (request?.buyerEmail) {
    sendMail({
      to: request.buyerEmail,
      subject: "Your order was delivered",
      text: `Your ${o.material} order has been marked delivered. Thanks for using HaulYard!\n\nLeave a rating: ${APP_URL}/buyer/requests`,
    });
  }
});

// Visible: your own bids (as hauler) + bids on your opportunities (as seller).
app.get('/api/bids', requireAuth, (req, res) => {
  const myOppIds = new Set(
    data.opportunities.filter((o) => o.sellerEmail === req.userEmail).map((o) => String(o.id))
  );
  const visible = data.bids.filter(
    (b) => b.haulerEmail === req.userEmail || myOppIds.has(String(b.oppId))
  );
  res.json(visible.map(withHauler));
});

app.post('/api/bids', writeLimiter, requireAuth, requireVerified, requireHaulerPlan, (req, res) => {
  const b = req.body || {};
  const bid = {
    id: newId('bid'),
    haulerEmail: req.userEmail,
    createdAt: new Date().toISOString(),
    status: 'pending',
    oppId: b.oppId,
    amount: b.amount,
    availability: b.availability ?? '',
    notes: b.notes ?? '',
  };
  data.bids.unshift(bid);
  save();
  res.json(bid);

  // Notify the opportunity's seller of a new bid.
  const opp = data.opportunities.find((o) => String(o.id) === String(bid.oppId));
  if (opp?.sellerEmail) {
    const hauler = data.accounts[req.userEmail];
    sendMail({
      to: opp.sellerEmail,
      subject: "New bid on your haul",
      text: `${hauler?.name || "A hauler"} bid $${bid.amount} on the haul for ${opp.material}.\n\nReview bids: ${APP_URL}/seller/listing`,
    });
  }
});

app.delete('/api/opportunities/:id', requireAuth, requireVerified, (req, res) => {
  const idx = data.opportunities.findIndex((x) => String(x.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Opportunity not found.' });
  if (
    data.opportunities[idx].sellerEmail &&
    data.opportunities[idx].sellerEmail !== req.userEmail &&
    !isAdmin(req.userEmail)
  ) {
    return res.status(403).json({ error: 'Not your opportunity.' });
  }
  data.opportunities.splice(idx, 1);
  save();
  res.json({ ok: true });
});

app.delete('/api/bids/:id', requireAuth, requireVerified, (req, res) => {
  const idx = data.bids.findIndex((x) => String(x.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Bid not found.' });
  if (
    data.bids[idx].haulerEmail &&
    data.bids[idx].haulerEmail !== req.userEmail &&
    !isAdmin(req.userEmail)
  ) {
    return res.status(403).json({ error: 'Not your bid.' });
  }
  data.bids.splice(idx, 1);
  save();
  res.json({ ok: true });
});

/* ------------------------------------------------------------------ *
 * Admin moderation
 *
 * Admins (ADMIN_EMAILS) get a full view of every post for cleanup. Deleting is
 * done through the normal DELETE endpoints, which let admins bypass the
 * owner-only check. Newest first so stale/spam posts are easy to spot.
 * ------------------------------------------------------------------ */
app.get('/api/admin/overview', requireAuth, requireAdmin, (req, res) => {
  const byNewest = (a, b) =>
    String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  const listings = [...data.listings].sort(byNewest).map(withSeller);
  const requests = [...data.requests].sort(byNewest).map(withBuyer);
  const opportunities = [...data.opportunities].sort(byNewest);
  const accounts = Object.values(data.accounts)
    .map((a) => ({
      email: a.email,
      name: a.name || '',
      company: a.company || '',
      createdAt: a.createdAt,
      verified: !!a.verified,
      suspended: !!a.suspended,
      isAdmin: isAdmin(a.email),
      listings: data.listings.filter((l) => l.sellerEmail === a.email).length,
      requests: data.requests.filter((r) => r.buyerEmail === a.email).length,
    }))
    .sort(byNewest);
  res.json({
    listings,
    requests,
    opportunities,
    accounts,
    counts: {
      listings: listings.length,
      requests: requests.length,
      opportunities: opportunities.length,
      accounts: accounts.length,
    },
  });
});

// Suspend / un-suspend an account. Suspended users can't log in and any live
// session is rejected. Guard rails: can't suspend yourself or another admin.
app.post('/api/admin/suspend', requireAuth, requireAdmin, (req, res) => {
  const target = String(req.body?.email || '').trim().toLowerCase();
  const suspend = req.body?.suspended !== false; // default true
  const account = data.accounts[target];
  if (!account) return res.status(404).json({ error: 'No such account.' });
  if (suspend && target === req.userEmail) {
    return res.status(400).json({ error: "You can't suspend your own account." });
  }
  if (suspend && isAdmin(target)) {
    return res.status(400).json({ error: "You can't suspend an admin account." });
  }
  account.suspended = suspend;
  save();
  res.json({ ok: true, email: target, suspended: suspend });
});

/* ------------------------------------------------------------------ *
 * Messages
 * ------------------------------------------------------------------ */

// A user's role on a request-based thread ('buyer' | 'seller'), or null if they
// don't participate.
function threadRole(threadId, email) {
  const request = data.requests.find((r) => String(r.id) === String(threadId));
  if (!request) return null;
  if (request.buyerEmail === email) return "buyer";
  const listing = data.listings.find(
    (l) => String(l.id) === String(request.listingId)
  );
  if (listing && listing.sellerEmail === email) return "seller";
  return null;
}

app.get('/api/messages', requireAuth, (req, res) => {
  const threadId = req.query.threadId;
  if (threadId) {
    if (!threadRole(threadId, req.userEmail)) {
      return res.status(403).json({ error: "Not a participant in this thread." });
    }
    return res.json(
      data.messages.filter((m) => String(m.threadId) === String(threadId))
    );
  }
  res.json(data.messages.filter((m) => m.senderEmail === req.userEmail));
});

// Inbox: the message threads the signed-in user participates in. Threads are
// keyed by a request id; participants are that request's buyer and the seller
// who owns the listing.
app.get('/api/threads', requireAuth, (req, res) => {
  const me = req.userEmail;
  const byThread = {};
  for (const m of data.messages) {
    (byThread[m.threadId] = byThread[m.threadId] || []).push(m);
  }
  const threads = [];
  for (const threadId of Object.keys(byThread)) {
    const request = data.requests.find((r) => String(r.id) === String(threadId));
    if (!request) continue; // only request-based threads for now
    const listing = data.listings.find(
      (l) => String(l.id) === String(request.listingId)
    );
    const sellerEmail = listing?.sellerEmail;
    const buyerEmail = request.buyerEmail;
    if (me !== sellerEmail && me !== buyerEmail) continue;

    const otherEmail = me === buyerEmail ? sellerEmail : buyerEmail;
    const other = data.accounts[otherEmail];
    const msgs = byThread[threadId]
      .slice()
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const last = msgs[msgs.length - 1];

    threads.push({
      threadId,
      requestId: request.id,
      title: `${request.material || "Material"} • ${request.quantity || ""} ${request.unit || ""}`.trim(),
      myRole: me === sellerEmail ? "seller" : "buyer",
      otherName: other?.name || otherEmail || "User",
      address: request.address || "",
      material: request.material || "",
      quantity: request.quantity,
      unit: request.unit || "",
      lastText: last?.text || "",
      lastAt: last?.createdAt || null,
      count: msgs.length,
    });
  }
  threads.sort((a, b) => new Date(b.lastAt || 0) - new Date(a.lastAt || 0));
  res.json(threads);
});

app.post('/api/messages', writeLimiter, requireAuth, requireVerified, (req, res) => {
  const b = req.body || {};
  const role = threadRole(b.threadId, req.userEmail);
  if (!role) {
    return res.status(403).json({ error: "Not a participant in this thread." });
  }
  if (!b.text || !String(b.text).trim()) {
    return res.status(400).json({ error: "Message text is required." });
  }
  const msg = {
    id: newId('msg'),
    threadId: b.threadId,
    senderEmail: req.userEmail,
    fromRole: role, // derived server-side, never trusted from the client
    text: String(b.text).trim(),
    createdAt: new Date().toISOString(),
  };
  data.messages.push(msg);
  save();
  res.json(msg);

  // Notify the other thread participant.
  const request = data.requests.find((r) => String(r.id) === String(msg.threadId));
  if (request) {
    const listing = data.listings.find((l) => String(l.id) === String(request.listingId));
    const otherEmail = role === "buyer" ? listing?.sellerEmail : request.buyerEmail;
    if (otherEmail) {
      const sender = data.accounts[req.userEmail];
      sendMail({
        to: otherEmail,
        subject: `New message from ${sender?.name || "a HaulYard user"}`,
        text: `${msg.text}\n\nReply: ${APP_URL}/messages`,
      });
    }
  }
});

/* ------------------------------------------------------------------ *
 * Beta feedback — a signed-in user sends feedback; we store it and
 * email the owner so nothing gets missed (uses the same mail pipeline).
 * ------------------------------------------------------------------ */
const FEEDBACK_TO = process.env.FEEDBACK_TO || 'alex@eclsite.com';
app.post('/api/feedback', writeLimiter, requireAuth, (req, res) => {
  const message = String(req.body?.message || '').trim();
  const page = String(req.body?.page || '').slice(0, 200);
  if (!message) return res.status(400).json({ error: 'Please enter your feedback.' });
  if (message.length > 4000) return res.status(400).json({ error: 'Feedback is too long (4000 character max).' });
  const account = data.accounts[req.userEmail];
  const entry = {
    id: newId('fb'),
    fromEmail: req.userEmail,
    fromName: account?.name || '',
    message,
    page,
    createdAt: new Date().toISOString(),
  };
  data.feedback.push(entry);
  save();
  res.json({ ok: true });

  sendMail({
    to: FEEDBACK_TO,
    subject: `HaulYard beta feedback from ${entry.fromName || req.userEmail}`,
    text: `From: ${entry.fromName} <${req.userEmail}>\nPage: ${page || 'n/a'}\nWhen: ${entry.createdAt}\n\n${message}`,
  });
});

/* ------------------------------------------------------------------ *
 * Reviews
 * ------------------------------------------------------------------ */

app.post('/api/reviews', requireAuth, requireVerified, (req, res) => {
  const { toEmail, rating, comment, oppId } = req.body || {};
  const r = Number(rating);
  if (!toEmail || !data.accounts[toEmail]) {
    return res.status(400).json({ error: 'Invalid recipient.' });
  }
  if (toEmail === req.userEmail) {
    return res.status(400).json({ error: "You can't review yourself." });
  }
  if (!Number.isFinite(r) || r < 1 || r > 5) {
    return res.status(400).json({ error: 'Rating must be 1–5.' });
  }
  // One review per reviewer -> recipient -> opportunity (update if it exists).
  const existing = data.reviews.find(
    (x) =>
      x.fromEmail === req.userEmail &&
      x.toEmail === toEmail &&
      String(x.oppId) === String(oppId)
  );
  if (existing) {
    existing.rating = r;
    existing.comment = (comment || '').trim();
    save();
    return res.json(existing);
  }
  const review = {
    id: newId('rev'),
    fromEmail: req.userEmail,
    toEmail,
    rating: r,
    comment: (comment || '').trim(),
    oppId: oppId || null,
    createdAt: new Date().toISOString(),
  };
  data.reviews.push(review);
  save();
  res.json(review);
});

// The signed-in user's submitted reviews (optionally for one opportunity).
app.get('/api/reviews/mine', requireAuth, (req, res) => {
  const { oppId } = req.query;
  let mine = data.reviews.filter((x) => x.fromEmail === req.userEmail);
  if (oppId) mine = mine.filter((x) => String(x.oppId) === String(oppId));
  res.json(mine);
});

/* ------------------------------------------------------------------ *
 * Billing endpoints
 * ------------------------------------------------------------------ */

app.get('/api/billing/status', requireAuth, (req, res) => {
  // During the free period, don't reveal that paid plans are coming — return
  // only the flag (the UI hides all billing then).
  if (!billingActive()) {
    return res.json({ billingActive: false });
  }
  const account = data.accounts[req.userEmail];
  res.json({
    billingActive: true,
    freePostsPerMonth: BILLING.freePostsPerMonth,
    postsThisMonth: postsThisMonth(req.userEmail),
    subscription: account.subscription || { status: 'none', plan: null, currentPeriodEnd: null },
    prices: { enduser: BILLING.enduserPrice, hauler: BILLING.haulerPrice },
  });
});

// STUB: real billing creates a Stripe Checkout session and confirms via webhook.
// Here we just mark the account active so the gating can be exercised end-to-end.
app.post('/api/billing/subscribe', requireAuth, (req, res) => {
  const { plan } = req.body || {};
  if (!['enduser', 'hauler'].includes(plan)) {
    return res.status(400).json({ error: 'Invalid plan.' });
  }
  const account = data.accounts[req.userEmail];
  const end = new Date();
  end.setDate(end.getDate() + 30);
  account.subscription = {
    status: 'active',
    plan,
    currentPeriodEnd: end.toISOString(),
    stub: true,
  };
  save();
  res.json({ ok: true, subscription: account.subscription });
});

app.post('/api/billing/cancel', requireAuth, (req, res) => {
  const account = data.accounts[req.userEmail];
  account.subscription = { status: 'none', plan: null, currentPeriodEnd: null };
  save();
  res.json({ ok: true });
});

/* ------------------------------------------------------------------ *
 * AI assistant (unchanged) + health
 * ------------------------------------------------------------------ */

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

app.post('/api/chat', async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({ error: 'OpenAI API key not configured. Please add your OPENAI_API_KEY.' });
    }
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }
    const systemMessage = {
      role: 'system',
      content: `You are a helpful AI assistant for HaulYard, a marketplace platform that connects soil buyers, sellers, and haulers.`,
    };
    const response = await openai.chat.completions.create({
      model: 'gpt-5',
      messages: [systemMessage, ...messages],
      max_completion_tokens: 1024,
    });
    res.json({ message: response.choices[0].message.content, role: 'assistant' });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

/* ------------------------------------------------------------------ *
 * Static frontend (single-service deploy)
 *
 * In production we serve the built React app (dist/) from this same server so
 * the whole app lives on ONE origin under ONE URL — no CORS, one deploy. Any
 * non-API GET falls through to index.html so client-side routes resolve.
 * Enabled when NODE_ENV=production (or SERVE_STATIC=true) and dist/ exists.
 * ------------------------------------------------------------------ */
const DIST_DIR = path.join(__dirname, 'dist');
const SERVE_STATIC =
  process.env.NODE_ENV === 'production' || process.env.SERVE_STATIC === 'true';
if (SERVE_STATIC) {
  if (fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
    app.use(express.static(DIST_DIR));
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(DIST_DIR, 'index.html'));
    });
    console.log('serving built frontend from', DIST_DIR);
  } else {
    console.warn(`SERVE_STATIC is on but ${DIST_DIR}/index.html is missing — run "npm run build" first.`);
  }
}

// Sentry error handler — must be registered after all routes. No-op unless
// SENTRY_DSN was set (Sentry.init ran in instrument.js).
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

const PORT = Number(process.env.PORT) || 3001;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// If something is already serving on this port (e.g. a second launcher), exit
// quietly instead of crashing — the existing instance keeps serving.
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} already in use — assuming the API server is already running.`);
    process.exit(0);
  }
  console.error('API server error:', err);
  process.exit(1);
});
