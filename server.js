import express from 'express';
import crypto from 'crypto';
import OpenAI from 'openai';
import { data, save } from './db.js';

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

const newId = (prefix) => `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || '').trim());

// Strip the password before sending an account to the client.
function publicUser(account) {
  if (!account) return null;
  const { password, ...rest } = account;
  return rest;
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
  req.userEmail = email;
  next();
}

/* ------------------------------------------------------------------ *
 * Auth + profile
 * ------------------------------------------------------------------ */

app.post('/api/auth/signup', (req, res) => {
  const { name, email, password, company } = req.body || {};
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!name || !name.trim()) return res.status(400).json({ error: 'Please enter your name.' });
  if (!isEmail(cleanEmail)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  if (data.accounts[cleanEmail]) return res.status(409).json({ error: 'An account with that email already exists.' });

  const account = {
    name: name.trim(),
    email: cleanEmail,
    password, // prototype only — hash this with a real backend
    company: (company || '').trim(),
    phone: '',
    region: '',
    roles: { buyer: true, seller: false, hauler: false },
    createdAt: new Date().toISOString(),
  };
  data.accounts[cleanEmail] = account;
  const token = crypto.randomUUID();
  data.sessions[token] = cleanEmail;
  save();
  res.json({ user: publicUser(account), token });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!isEmail(cleanEmail)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  const account = data.accounts[cleanEmail];
  if (!account || account.password !== password) {
    return res.status(401).json({ error: 'Email or password is incorrect.' });
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
  const { name, company, phone, region, roles } = req.body || {};
  if (name !== undefined) account.name = name;
  if (company !== undefined) account.company = company;
  if (phone !== undefined) account.phone = phone;
  if (region !== undefined) account.region = region;
  if (roles !== undefined) account.roles = roles;
  save();
  res.json({ user: publicUser(account) });
});

/* ------------------------------------------------------------------ *
 * Listings
 * ------------------------------------------------------------------ */

app.get('/api/listings', requireAuth, (req, res) => {
  // Everyone signed in can browse all listings.
  res.json(data.listings);
});

app.post('/api/listings', requireAuth, (req, res) => {
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

app.patch('/api/listings/:id', requireAuth, (req, res) => {
  const l = data.listings.find((x) => String(x.id) === String(req.params.id));
  if (!l) return res.status(404).json({ error: 'Listing not found.' });
  if (l.sellerEmail && l.sellerEmail !== req.userEmail) {
    return res.status(403).json({ error: 'Not your listing.' });
  }
  Object.assign(l, req.body || {});
  save();
  res.json(l);
});

app.delete('/api/listings/:id', requireAuth, (req, res) => {
  const idx = data.listings.findIndex((x) => String(x.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Listing not found.' });
  if (data.listings[idx].sellerEmail && data.listings[idx].sellerEmail !== req.userEmail) {
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
  res.json(visible);
});

app.post('/api/requests', requireAuth, (req, res) => {
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
});

app.patch('/api/requests/:id', requireAuth, (req, res) => {
  const r = data.requests.find((x) => String(x.id) === String(req.params.id));
  if (!r) return res.status(404).json({ error: 'Request not found.' });
  Object.assign(r, req.body || {});
  save();
  res.json(r);
});

app.delete('/api/requests/:id', requireAuth, (req, res) => {
  const idx = data.requests.findIndex((x) => String(x.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Request not found.' });
  if (data.requests[idx].buyerEmail && data.requests[idx].buyerEmail !== req.userEmail) {
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
  const visible = data.opportunities.filter(
    (o) =>
      o.status === 'open' ||
      o.sellerEmail === req.userEmail ||
      myBidOppIds.has(String(o.id))
  );
  res.json(visible);
});

app.post('/api/opportunities', requireAuth, (req, res) => {
  const b = req.body || {};
  const opp = {
    id: newId('opp'),
    sellerEmail: req.userEmail,
    createdAt: new Date().toISOString(),
    status: 'open',
    awardedBidId: null,
    ...b,
  };
  opp.id = opp.id || newId('opp');
  data.opportunities.unshift(opp);
  save();
  res.json(opp);
});

app.patch('/api/opportunities/:id', requireAuth, (req, res) => {
  const o = data.opportunities.find((x) => String(x.id) === String(req.params.id));
  if (!o) return res.status(404).json({ error: 'Opportunity not found.' });
  Object.assign(o, req.body || {});
  save();
  res.json(o);
});

// Atomic award: mark the opp awarded + winning bid awarded + others rejected.
app.post('/api/opportunities/:id/award', requireAuth, (req, res) => {
  const o = data.opportunities.find((x) => String(x.id) === String(req.params.id));
  if (!o) return res.status(404).json({ error: 'Opportunity not found.' });
  if (o.sellerEmail && o.sellerEmail !== req.userEmail) {
    return res.status(403).json({ error: 'Not your opportunity.' });
  }
  const { bidId } = req.body || {};
  o.status = 'awarded';
  o.awardedBidId = bidId;
  data.bids.forEach((b) => {
    if (String(b.oppId) !== String(o.id)) return;
    b.status = String(b.id) === String(bidId) ? 'awarded' : 'rejected';
  });
  save();
  res.json({ opportunity: o, bids: data.bids.filter((b) => String(b.oppId) === String(o.id)) });
});

// Visible: your own bids (as hauler) + bids on your opportunities (as seller).
app.get('/api/bids', requireAuth, (req, res) => {
  const myOppIds = new Set(
    data.opportunities.filter((o) => o.sellerEmail === req.userEmail).map((o) => String(o.id))
  );
  const visible = data.bids.filter(
    (b) => b.haulerEmail === req.userEmail || myOppIds.has(String(b.oppId))
  );
  res.json(visible);
});

app.post('/api/bids', requireAuth, (req, res) => {
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
});

app.delete('/api/opportunities/:id', requireAuth, (req, res) => {
  const idx = data.opportunities.findIndex((x) => String(x.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Opportunity not found.' });
  if (data.opportunities[idx].sellerEmail && data.opportunities[idx].sellerEmail !== req.userEmail) {
    return res.status(403).json({ error: 'Not your opportunity.' });
  }
  data.opportunities.splice(idx, 1);
  save();
  res.json({ ok: true });
});

app.delete('/api/bids/:id', requireAuth, (req, res) => {
  const idx = data.bids.findIndex((x) => String(x.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Bid not found.' });
  if (data.bids[idx].haulerEmail && data.bids[idx].haulerEmail !== req.userEmail) {
    return res.status(403).json({ error: 'Not your bid.' });
  }
  data.bids.splice(idx, 1);
  save();
  res.json({ ok: true });
});

/* ------------------------------------------------------------------ *
 * Messages
 * ------------------------------------------------------------------ */

app.get('/api/messages', requireAuth, (req, res) => {
  // Messages the user sent, or on threads they participate in. For the
  // prototype, return threads the user has sent on plus any thread id queried.
  const threadId = req.query.threadId;
  if (threadId) {
    return res.json(data.messages.filter((m) => String(m.threadId) === String(threadId)));
  }
  res.json(data.messages.filter((m) => m.senderEmail === req.userEmail));
});

app.post('/api/messages', requireAuth, (req, res) => {
  const b = req.body || {};
  const msg = {
    id: newId('msg'),
    threadId: b.threadId,
    senderEmail: req.userEmail,
    fromRole: b.fromRole ?? 'buyer',
    text: b.text ?? '',
    createdAt: new Date().toISOString(),
  };
  data.messages.push(msg);
  save();
  res.json(msg);
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
      content: `You are a helpful AI assistant for SoilConnect, a marketplace platform that connects soil buyers, sellers, and haulers.`,
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

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server running on port ${PORT}`);
});
