// Thin client for the Site-Sync backend. Stores the session token in
// localStorage and attaches it to every request.
//
// Where the API lives is configurable and NOT hardcoded:
//   - Default (empty): calls use a relative "/api/..." path. This is correct
//     when the frontend and API are served from the SAME address — our
//     single-service web deploy — and also works in dev via the Vite proxy.
//   - Set VITE_API_URL at build time to point at an absolute API address, e.g.
//     VITE_API_URL=https://soilconnect.onrender.com
//     Then requests go to https://soilconnect.onrender.com/api/... This is what
//     a future native phone app build would use (it can't use a relative path).
const API_BASE = (import.meta.env?.VITE_API_URL || "").replace(/\/+$/, "");

const TOKEN_KEY = "dirtapp_token";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

async function request(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    /* no/invalid JSON body */
  }

  if (!res.ok) {
    const err = new Error(payload?.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return payload;
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  patch: (path, body) => request("PATCH", path, body),
  del: (path) => request("DELETE", path),
};
