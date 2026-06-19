import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const AuthContext = createContext(null);

const LS_USER = "dirtapp_auth_user"; // currently signed-in user
const LS_ACCOUNTS = "dirtapp_accounts"; // all registered accounts (simulated)

// NOTE: This is a SIMULATED auth layer backed by localStorage — no real
// security, no hashing, single-device only. It exists so the entry flow is
// validated and stable until the real backend lands.

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState({});
  const [ready, setReady] = useState(false);

  // Load persisted auth state once on mount.
  useEffect(() => {
    setAccounts(readJSON(LS_ACCOUNTS, {}));
    setUser(readJSON(LS_USER, null));
    setReady(true);
  }, []);

  // Persist accounts + current user whenever they change (after load).
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(LS_ACCOUNTS, JSON.stringify(accounts));
    } catch (e) {
      console.error("AuthContext: failed to save accounts", e);
    }
  }, [accounts, ready]);

  useEffect(() => {
    if (!ready) return;
    try {
      if (user) localStorage.setItem(LS_USER, JSON.stringify(user));
      else localStorage.removeItem(LS_USER);
    } catch (e) {
      console.error("AuthContext: failed to save user", e);
    }
  }, [user, ready]);

  // Returns { ok: true } or { ok: false, error: "..." }
  function signup({ name, email, password, company }) {
    const cleanEmail = String(email || "").trim().toLowerCase();
    if (!name || !name.trim()) return { ok: false, error: "Please enter your name." };
    if (!isValidEmail(cleanEmail))
      return { ok: false, error: "Please enter a valid email address." };
    if (!password || password.length < 6)
      return { ok: false, error: "Password must be at least 6 characters." };
    if (accounts[cleanEmail])
      return { ok: false, error: "An account with that email already exists." };

    const account = {
      name: name.trim(),
      email: cleanEmail,
      password, // simulated only — never do this with a real backend
      company: (company || "").trim(),
      createdAt: new Date().toISOString(),
    };
    setAccounts((prev) => ({ ...prev, [cleanEmail]: account }));

    const { password: _pw, ...safeUser } = account;
    setUser(safeUser);
    return { ok: true };
  }

  function login({ email, password }) {
    const cleanEmail = String(email || "").trim().toLowerCase();
    if (!isValidEmail(cleanEmail))
      return { ok: false, error: "Please enter a valid email address." };
    if (!password) return { ok: false, error: "Please enter your password." };

    const account = accounts[cleanEmail];
    if (!account || account.password !== password)
      return { ok: false, error: "Email or password is incorrect." };

    const { password: _pw, ...safeUser } = account;
    setUser(safeUser);
    return { ok: true };
  }

  function logout() {
    setUser(null);
  }

  // Update the signed-in user's profile (and the stored account).
  function updateProfile(patch) {
    if (!user) return { ok: false, error: "Not signed in." };
    const next = { ...user, ...patch };
    setUser(next);
    setAccounts((prev) => {
      const existing = prev[user.email];
      if (!existing) return prev;
      return { ...prev, [user.email]: { ...existing, ...patch } };
    });
    return { ok: true };
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      ready,
      signup,
      login,
      logout,
      updateProfile,
    }),
    [user, ready, accounts]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>.");
  return ctx;
}
