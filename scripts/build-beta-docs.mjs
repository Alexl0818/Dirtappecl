// Generates the beta launch docs as Word (.docx) files with real check-off
// boxes. Run:  node scripts/build-beta-docs.mjs
// Then (optional) convert to PDF with the docx skill's LibreOffice helper.
//
// Requires the global "docx" package. We resolve it from the global modules dir
// so this works without a local node_modules.

import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
let docx;
try {
  docx = require("docx");
} catch {
  // Fall back to the global install location.
  const globalRoot = execSync("npm root -g").toString().trim();
  docx = require(path.join(globalRoot, "docx"));
}

const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  BorderStyle, LevelFormat, PageNumber, Header, Footer,
} = docx;

const OUT_DIR = path.resolve("beta-docs");
fs.mkdirSync(OUT_DIR, { recursive: true });

const GREEN = "2E7D32";
const GREY = "555555";
const LETTER = { width: 12240, height: 15840 };
const MARGIN = { top: 1440, right: 1440, bottom: 1440, left: 1440 };

// ---- small builders --------------------------------------------------------

const h1 = (text) =>
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
const h2 = (text) =>
  new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });

const para = (runs, opts = {}) =>
  new Paragraph({
    spacing: { after: 120, ...(opts.spacing || {}) },
    children: Array.isArray(runs) ? runs : [new TextRun(runs)],
    ...opts,
  });

// A check-off line: a box glyph + text, hanging indent so wraps align.
function checkItem(state, runs) {
  const box = state === "done" ? "☑" : state === "wip" ? "◐" : "☐";
  const children = [new TextRun({ text: box + "  ", size: 24 })];
  for (const r of Array.isArray(runs) ? runs : [runs]) {
    children.push(typeof r === "string" ? new TextRun(r) : r);
  }
  return new Paragraph({
    spacing: { after: 80 },
    indent: { left: 360, hanging: 360 },
    children,
  });
}

const bold = (t) => new TextRun({ text: t, bold: true });
const txt = (t) => new TextRun(t);
const muted = (t) => new TextRun({ text: t, italics: true, color: GREY });
const mono = (t) => new TextRun({ text: t, font: "Consolas", size: 18 });

function ruleParagraph() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC", space: 1 } },
    spacing: { after: 160 },
    children: [new TextRun("")],
  });
}

function titleBlock(title, subtitle) {
  return [
    new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: title, bold: true, size: 40, color: GREEN })],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: subtitle, color: GREY, size: 22 })],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: "Updated 2026-06-26 · HaulYard", color: GREY, italics: true, size: 18 })],
    }),
  ];
}

function docShell(children) {
  return new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 22 } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 28, bold: true, color: GREEN, font: "Arial" },
          paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 24, bold: true, font: "Arial" },
          paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 1 } },
      ],
    },
    sections: [{
      properties: { page: { size: LETTER, margin: MARGIN } },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "HaulYard — Beta Launch   ·   Page ", color: GREY, size: 16 }),
              new TextRun({ children: [PageNumber.CURRENT], color: GREY, size: 16 }),
            ],
          })],
        }),
      },
      children,
    }],
  });
}

// ---- CHECKLIST -------------------------------------------------------------

function buildChecklist() {
  const c = [];
  c.push(...titleBlock("Beta Launch Checklist", "Print this and check items off as we go."));

  c.push(new Paragraph({
    spacing: { after: 160 },
    children: [muted("Legend:  "), txt("☐ = not started    "), txt("◐ = in progress    "), txt("☑ = done")],
  }));

  c.push(h1("Phase 0 — Code hardening  (no accounts needed)"));
  c.push(checkItem("done", [bold("Email verification non-blocking for beta"), txt(" — env toggle so testers aren’t locked out before SMTP")]));
  c.push(checkItem("done", [bold("Password reset"), txt(" — forgot password → email link → set new password")]));
  c.push(checkItem("done", [bold("Rate limiting"), txt(" on public API (signup/login/post abuse protection)")]));
  c.push(checkItem("done", [bold("Lock down CORS"), txt(" to the real frontend domain (env allowlist)")]));
  c.push(checkItem("wip", [bold("Server-side input validation"), txt(" pass on all write endpoints "), muted("(body-cap + core done; full sweep pending)")]));
  c.push(checkItem("done", [bold(".env.example"), txt(" documenting every config value")]));
  c.push(checkItem("todo", [bold("Friendly 404 / error pages"), txt(" + consistent API error shape")]));
  c.push(checkItem("todo", [bold("Data backup"), txt(" strategy (even a daily file copy for now)")]));

  c.push(h1("Phase 1 — Production data layer"));
  c.push(checkItem("todo", [bold("Decision:"), txt(" keep JSON file (tiny closed beta only) OR move to Postgres")]));
  c.push(checkItem("todo", [txt("If Postgres: schema + migration from current JSON")]));
  c.push(checkItem("todo", [txt("Seed/admin script for test accounts")]));
  c.push(checkItem("todo", [txt("Automated backup (snapshot/dump on a schedule)")]));

  c.push(h1("Phase 2 — Deployment  (get a shareable URL)"));
  c.push(checkItem("done", [bold("Single-service architecture"), txt(" — Express serves built frontend + API on one origin (no CORS)")]));
  c.push(checkItem("done", [bold("Deploy config"), txt(" committed: Dockerfile, render.yaml, npm start, configurable data dir")]));
  c.push(checkItem("done", [bold("Production build"), txt(" verified locally (serves UI + API, SPA routing, data persists)")]));
  c.push(checkItem("todo", [bold("Pick a host & deploy"), txt(" (Render Blueprint recommended) "), muted("— needs your host account")]));
  c.push(checkItem("todo", [txt("Set production environment variables on the host (APP_URL, attach persistent disk)")]));
  c.push(checkItem("todo", [txt("HTTPS + custom domain (optional; host provides HTTPS by default)")]));
  c.push(checkItem("todo", [txt("Smoke-test the full loop on the live URL")]));

  c.push(h1("Phase 3 — Integrations  (need your credentials)"));
  c.push(checkItem("todo", [bold("Real SMTP"), txt(" (verification, resets, notifications)")]));
  c.push(checkItem("todo", [txt("Geocoder: keep free Nominatim for beta OR add paid key")]));
  c.push(checkItem("todo", [bold("Stripe"), txt(" — NOT needed for free beta; defer to paid phase")]));

  c.push(h1("Phase 4 — Observability & safety"));
  c.push(checkItem("todo", [bold("Error monitoring"), txt(" (e.g. Sentry) for crashes testers hit")]));
  c.push(checkItem("todo", [txt("Structured request/error logging on the server")]));
  c.push(checkItem("todo", [txt("Basic uptime check / health ping")]));
  c.push(checkItem("todo", [txt("(Optional) lightweight analytics: signups, posts, bids")]));

  c.push(h1("Phase 5 — Beta operations & legal"));
  c.push(checkItem("todo", [bold("Closed-beta gating"), txt(" (invite code or allowlist)")]));
  c.push(checkItem("todo", [bold("Feedback channel"), txt(" (in-app link, form, or email)")]));
  c.push(checkItem("todo", [bold("Privacy Policy + Terms of Service"), txt(" (required to collect emails)")]));
  c.push(checkItem("todo", [txt("Short “Welcome to the beta” guide for testers")]));
  c.push(checkItem("todo", [txt("Final pre-launch smoke test + go/no-go")]));

  c.push(ruleParagraph());
  c.push(h2("Definition of “ready for closed beta”"));
  c.push(para([
    txt("All of "), bold("Phase 0"), txt(", "), bold("Phase 2"), txt(", the "), bold("SMTP"),
    txt(" item in Phase 3, plus "), bold("Phase 5"), txt(" gating + feedback + privacy/terms. "),
    txt("Phase 1 (Postgres) and Phase 4 (monitoring) can trail slightly for a small invite-only group, but should land before opening it wider."),
  ]));

  return docShell(c);
}

// ---- ROADMAP ---------------------------------------------------------------

const DIAGRAM = [
  "PHASE 0 (harden) ─► PHASE 2 (deploy) ─► SMTP (Phase 3) ─► PHASE 5 (gate+legal) ─► LIVE BETA",
  "      │                                                        ▲",
  "      └────────► PHASE 1 (Postgres) ───────────────────────────┘",
  "                 (can land just after launch for a tiny closed beta)",
];

function phaseBlock(title, meta, lines) {
  const out = [h1(title)];
  out.push(new Paragraph({ spacing: { after: 100 }, children: [muted(meta)] }));
  for (const ln of lines) out.push(para(ln));
  return out;
}

function buildRoadmap() {
  const c = [];
  c.push(...titleBlock("Beta Launch Roadmap", "The sequenced plan behind the checklist."));

  c.push(h2("The path to a live URL (critical path)"));
  for (const line of DIAGRAM) {
    c.push(new Paragraph({ spacing: { after: 0 }, children: [mono(line)] }));
  }
  c.push(para([muted("Phase 4 (monitoring) runs in parallel — wire it once a host exists.")], { spacing: { before: 120, after: 200 } }));

  c.push(...phaseBlock(
    "Phase 0 — Code hardening   ·   ~1 session   ·   mostly Claude",
    "Goal: the code is safe to expose to strangers.  STATUS: DONE.",
    [
      [bold("Verification toggle"), txt(" — auto-verify new users when no SMTP, so testers aren’t locked out.")],
      [bold("Password reset"), txt(" — forgot → token link → reset; returns link in no-SMTP beta.")],
      [bold("Rate limiting"), txt(" — per-IP limiter on auth + posts.")],
      [bold("CORS lock"), txt(" — allowed origin from env; body-size cap.")],
      [bold(".env.example"), txt(" — every knob documented; server auto-loads .env.")],
    ]
  ));

  c.push(...phaseBlock(
    "Phase 1 — Production data layer   ·   ~1 session   ·   You decide, then Claude",
    "Goal: data survives concurrent users and restarts.",
    [
      [bold("Decision point:"), txt(" JSON file is fine for a 5–10 person invite beta. Beyond that, Postgres.")],
      [txt("If Postgres: schema + one-time migration from data.json; same API, nothing else changes.")],
      [txt("Either way: a scheduled backup (file copy or pg_dump).")],
      [muted("Recommendation: ship the closed beta on JSON to move fast; do the Postgres swap in parallel; cut over before widening.")],
    ]
  ));

  c.push(...phaseBlock(
    "Phase 2 — Deployment   ·   ~1 session   ·   Claude builds config, You click deploy",
    "Goal: a URL you can text to a tester.",
    [
      [txt("Deploy config (Dockerfile + render.yaml/Procfile) and a prod build pointing the frontend at the live API.")],
      [txt("You create the host accounts and connect the repo (I can’t provision those).")],
      [txt("We smoke-test the whole loop on the live URL together.")],
    ]
  ));

  c.push(...phaseBlock(
    "Phase 3 — Integrations   ·   You supply keys, Claude wires",
    "Goal: real email; geocoding that won’t throttle.",
    [
      [bold("SMTP (required for launch):"), txt(" any provider (Resend, Postmark, SendGrid, Gmail SMTP). Already coded — drop-in.")],
      [bold("Geocoder (optional):"), txt(" Nominatim is fine for low beta traffic; add a paid key only if testers hit throttling.")],
      [bold("Stripe:"), txt(" skip for now — beta is free; billing stays hidden.")],
    ]
  ));

  c.push(...phaseBlock(
    "Phase 4 — Observability   ·   ~½ session   ·   Claude + You for the Sentry key",
    "Goal: you find out about bugs before testers complain.",
    [[txt("Error monitoring (Sentry free tier), server logging, a health/uptime ping.")]]
  ));

  c.push(...phaseBlock(
    "Phase 5 — Beta ops & legal   ·   ~½ session   ·   Claude drafts, You approve",
    "Goal: controlled, lawful, friendly beta.",
    [
      [txt("Invite-code/allowlist gating so signups stay intentional.")],
      [txt("In-app feedback link.")],
      [txt("Basic Privacy Policy + Terms (you’re collecting emails — these are needed).")],
      [txt("A short tester welcome guide.")],
    ]
  ));

  c.push(ruleParagraph());
  c.push(h2("Suggested order of operations"));
  const steps = [
    "Now: Phase 0 items (all code, no waiting on you).  — DONE",
    "Next: Phase 2 deploy config + Phase 5 drafts (legal/welcome) so they’re ready.",
    "When you have an SMTP login + host accounts: wire SMTP, deploy, smoke-test → closed beta is live.",
    "In parallel / right after: Phase 1 Postgres swap + Phase 4 monitoring before widening.",
  ];
  steps.forEach((s, i) =>
    c.push(new Paragraph({
      numbering: { reference: "steps", level: 0 },
      spacing: { after: 80 },
      children: [new TextRun(s)],
    }))
  );

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 22 } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 26, bold: true, color: GREEN, font: "Arial" },
          paragraph: { spacing: { before: 260, after: 120 }, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 24, bold: true, font: "Arial" },
          paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 1 } },
      ],
    },
    numbering: {
      config: [{
        reference: "steps",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 480, hanging: 360 } } } }],
      }],
    },
    sections: [{
      properties: { page: { size: LETTER, margin: MARGIN } },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "HaulYard — Beta Launch   ·   Page ", color: GREY, size: 16 }),
              new TextRun({ children: [PageNumber.CURRENT], color: GREY, size: 16 }),
            ],
          })],
        }),
      },
      children: c,
    }],
  });
  return doc;
}

// ---- write -----------------------------------------------------------------

async function write(doc, name) {
  const buf = await Packer.toBuffer(doc);
  const p = path.join(OUT_DIR, name);
  fs.writeFileSync(p, buf);
  console.log("wrote", p);
}

await write(buildChecklist(), "HaulYard-Beta-Checklist.docx");
await write(buildRoadmap(), "HaulYard-Beta-Roadmap.docx");
console.log("done");
