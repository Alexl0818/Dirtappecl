// Tiny JSON-file datastore for the Site-Sync backend.
// Not built for scale — a single-process, file-backed store that's perfect for a
// prototype and works on Replit (Run button). Swap for a real DB later without
// touching the API surface.
//
// Durability: writes are atomic (temp file + rename) so a crash mid-write can't
// corrupt the store, and any pending write is flushed synchronously on shutdown.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Where the JSON store lives. Defaults to ./data.json next to this file. In
// production set DATA_FILE (full path) or DATA_DIR (directory) to point at a
// MOUNTED PERSISTENT DISK — otherwise the host's ephemeral filesystem wipes the
// data on every redeploy/restart. (This is the JSON-store limitation we replace
// with Postgres in Phase 1.)
const DATA_FILE =
  process.env.DATA_FILE ||
  (process.env.DATA_DIR
    ? path.join(process.env.DATA_DIR, "data.json")
    : path.join(__dirname, "data.json"));
const TMP_FILE = DATA_FILE + ".tmp";

// Make sure the target directory exists (e.g. a freshly-mounted volume).
try {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
} catch {
  /* best-effort; write errors are handled below */
}

const EMPTY = {
  accounts: {}, // email -> { name, email, password, company, phone, region, roles, createdAt }
  sessions: {}, // token -> email
  listings: [],
  requests: [],
  opportunities: [],
  bids: [],
  messages: [], // { id, threadId, senderEmail, fromRole, text, createdAt }
  reviews: [], // { id, fromEmail, toEmail, rating, comment, oppId, createdAt }
  feedback: [], // { id, fromEmail, fromName, message, page, createdAt }
  inviteCodes: [], // { code, label, maxUses (null=unlimited), uses, createdAt, createdBy }
  settings: { inviteOnly: false }, // when true, signup requires a valid invite code
};

let data;
try {
  if (fs.existsSync(DATA_FILE)) {
    data = { ...EMPTY, ...JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) };
  } else {
    data = structuredClone(EMPTY);
  }
} catch (e) {
  console.error("db: failed to load data.json, starting empty:", e.message);
  data = structuredClone(EMPTY);
}

let timer = null;
let dirty = false;

function writeNow() {
  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(data, null, 2));
    fs.renameSync(TMP_FILE, DATA_FILE); // atomic on the same filesystem
    dirty = false;
  } catch (e) {
    console.error("db: failed to save data.json:", e.message);
  }
}

export function save() {
  dirty = true;
  if (timer) clearTimeout(timer);
  timer = setTimeout(writeNow, 50);
}

// Write any pending changes immediately (used on shutdown).
export function flush() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (dirty) writeNow();
}

// Don't lose buffered writes when the process is told to stop.
process.on("exit", flush);
process.on("SIGINT", () => {
  flush();
  process.exit(0);
});
process.on("SIGTERM", () => {
  flush();
  process.exit(0);
});

export { data };
