import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, getToken, setToken } from "../lib/api";

const AuthContext = createContext(null);

// Real auth backed by the server (token in localStorage). Replaces the previous
// simulated localStorage-only layer; same hook surface so screens are unchanged.

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // Restore the session on boot: if we have a token, ask the server who we are.
  useEffect(() => {
    let cancelled = false;
    async function restore() {
      if (!getToken()) {
        if (!cancelled) setReady(true);
        return;
      }
      try {
        const { user: me } = await api.get("/auth/me");
        if (!cancelled) setUser(me);
      } catch {
        setToken(null); // stale/invalid token
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  async function signup(form) {
    try {
      const { user: me, token } = await api.post("/auth/signup", form);
      setToken(token);
      setUser(me);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  async function login(form) {
    try {
      const { user: me, token } = await api.post("/auth/login", form);
      setToken(token);
      setUser(me);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch {
      /* ignore network errors on logout */
    }
    setToken(null);
    setUser(null);
  }

  async function updateProfile(patch) {
    try {
      const { user: me } = await api.patch("/profile", patch);
      setUser(me);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  async function resendVerification() {
    try {
      const res = await api.post("/auth/resend-verification");
      // In environments with no mail provider, the server returns a direct link.
      return { ok: true, verifyUrl: res?.verifyUrl };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  // Start a password reset. Always resolves ok (server never reveals whether the
  // email exists); in no-SMTP mode the server returns a direct reset link.
  async function forgotPassword(email) {
    try {
      const res = await api.post("/auth/forgot-password", { email });
      return { ok: true, resetUrl: res?.resetUrl };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  // Complete a password reset with the emailed token + a new password.
  async function resetPassword(token, password) {
    try {
      await api.post("/auth/reset-password", { token, password });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  // Re-pull the current user (e.g. after email verification).
  async function refreshUser() {
    try {
      const { user: me } = await api.get("/auth/me");
      setUser(me);
    } catch {
      /* ignore */
    }
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
      resendVerification,
      forgotPassword,
      resetPassword,
      refreshUser,
    }),
    [user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>.");
  return ctx;
}
