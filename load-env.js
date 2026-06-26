// Loads a local .env into process.env BEFORE any other module reads env vars.
// Import this first (side-effect import) in server.js. Zero-dependency; uses
// Node's built-in env-file loader (Node 20.12+). Production hosts inject env
// vars directly, so this is just a dev/staging convenience and is a no-op when
// no .env file exists.

import fs from 'node:fs';

try {
  if (typeof process.loadEnvFile === 'function' && fs.existsSync('.env')) {
    process.loadEnvFile('.env');
    console.log('env: loaded .env');
  }
} catch (e) {
  console.warn('env: could not load .env —', e.message);
}
