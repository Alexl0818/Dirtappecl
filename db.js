// Tiny JSON-file datastore for the Site-Sync backend.
// Not built for scale — a single-process, file-backed store that's perfect for a
// prototype and works on Replit. Swap for Postgres/Supabase later without
// touching the API surface.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "data.json");

const EMPTY = {
  accounts: {}, // email -> { name, email, password, company, phone, region, roles, createdAt }
  sessions: {}, // token -> email
  listings: [],
  requests: [],
  opportunities: [],
  bids: [],
  messages: [], // { id, threadId, senderEmail, fromRole, text, createdAt }
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
export function save() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error("db: failed to save data.json:", e.message);
    }
  }, 50);
}

export { data };
