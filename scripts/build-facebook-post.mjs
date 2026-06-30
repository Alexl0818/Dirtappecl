// Generates "HaulYard-Facebook-Post.docx" into ./beta-docs/
// Run via: NODE_PATH="$(npm root -g)" node scripts/build-facebook-post.mjs
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
let docx;
try {
  docx = require("docx");
} catch {
  docx = require(join(execSync("npm root -g").toString().trim(), "docx"));
}
const {
  Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, ShadingType,
} = docx;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "beta-docs");
const GREEN = "15803D";
const DARK = "166534";
const GREY = "5B6B60";

const h1 = (t) =>
  new Paragraph({
    spacing: { after: 60 },
    children: [new TextRun({ text: t, bold: true, size: 44, color: GREEN })],
  });

const sub = (t) =>
  new Paragraph({
    spacing: { after: 320 },
    children: [new TextRun({ text: t, color: GREY, size: 21 })],
  });

const h2 = (t) =>
  new Paragraph({
    spacing: { before: 360, after: 120 },
    border: { bottom: { color: "BBF7D0", style: BorderStyle.SINGLE, size: 12, space: 4 } },
    children: [new TextRun({ text: t, bold: true, size: 26, color: DARK })],
  });

// A "post box": shaded paragraphs the user copies verbatim.
const postBox = (lines) =>
  lines.map((line, i) =>
    new Paragraph({
      shading: { type: ShadingType.CLEAR, fill: "F4FAF6" },
      border: {
        top: i === 0 ? { color: "CFE9D8", style: BorderStyle.SINGLE, size: 8, space: 6 } : undefined,
        bottom: i === lines.length - 1 ? { color: "CFE9D8", style: BorderStyle.SINGLE, size: 8, space: 6 } : undefined,
        left: { color: "CFE9D8", style: BorderStyle.SINGLE, size: 8, space: 8 },
        right: { color: "CFE9D8", style: BorderStyle.SINGLE, size: 8, space: 8 },
      },
      spacing: { after: line === "" ? 120 : 60 },
      children: [new TextRun({ text: line || " ", size: 24 })],
    })
  );

const bullet = (runs) =>
  new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children: runs });

const t = (text, opts = {}) => new TextRun({ text, size: 22, ...opts });

const mainPost = [
  "🚜 Introducing HAULYARD — the easy way to move dirt.",
  "",
  "Got soil, fill, or material you need to get rid of? Need clean fill brought in? Or do you haul loads for a living? HaulYard connects all three — buyers, sellers, and haulers — in one simple app.",
  "",
  "✅ Post what you have or what you need — in seconds",
  "✅ Find material (or a place to dump it) near you on the map",
  "✅ Connect with haulers to move it",
  "✅ No middlemen. No fees on your deals. Free to use.",
  "",
  "It's live and open right now 👇",
  "👉 app.eclsite.com",
  "",
  "I'm letting people in early and I'd love your honest feedback. Give it a try and tell me what you think — there's a \"Send feedback\" button right inside the app.",
  "",
  "#dirt #soil #excavation #hauling #construction #landscaping #fill #grading",
];

const shortPost = [
  "New app alert 🚜 HaulYard connects people who HAVE dirt/fill with people who NEED it — plus haulers to move it. No fees on your deals, free to use. Check it out 👉 app.eclsite.com",
];

const tinyPost = ["Got dirt? Need dirt? Haul dirt? 🚜 HaulYard. → app.eclsite.com"];

const doc = new Document({
  sections: [{
    properties: { page: { margin: { top: 1224, bottom: 1224, left: 1224, right: 1224 } } },
    children: [
      h1("HaulYard — Facebook Post"),
      sub("Copy & paste straight onto your page. Updated 2026-06-30 · ECL Site Works"),

      h2("Main post (recommended)"),
      ...postBox(mainPost),

      h2("Short version (for a quick post or comment)"),
      ...postBox(shortPost),

      h2("Even shorter (for a story or caption)"),
      ...postBox(tinyPost),

      h2("Posting tips"),
      bullet([t("Add a photo or short video. ", { bold: true }), t("A jobsite pic, a dump truck, or a screenshot of the app's map gets 3–5× more views than text alone.")]),
      bullet([t("Pin the post ", { bold: true }), t("to the top of your page so new visitors see it first.")]),
      bullet([t("The link: ", { bold: true }), t("app.eclsite.com", { color: GREEN, bold: true }), t(" — Facebook auto-detects it. For the clickable preview card, paste the link on its own line and wait a second for the preview to load.")]),
      bullet([t("Best time to post: ", { bold: true }), t("weekday mornings (6–9am) tend to land well with the trades crowd.")]),
      bullet([t("Reply to every comment ", { bold: true }), t("in the first hour — it pushes the post to more feeds.")]),

      new Paragraph({
        spacing: { before: 240 },
        children: [t("Heads-up: ", { italics: true, color: GREY }), t("app.eclsite.com is your live app. The first visitor after a quiet spell may wait a few seconds for it to wake up, then it's fast.", { italics: true, color: GREY })],
      }),

      new Paragraph({
        spacing: { before: 520 },
        alignment: AlignmentType.CENTER,
        children: [t("HaulYard · ECL Site Works · app.eclsite.com", { color: "8A978F", size: 18 })],
      }),
    ],
  }],
});

await mkdir(OUT, { recursive: true });
const buf = await Packer.toBuffer(doc);
const path = join(OUT, "HaulYard-Facebook-Post.docx");
await writeFile(path, buf);
console.log("wrote " + path);
