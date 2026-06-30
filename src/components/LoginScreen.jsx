// src/components/LoginScreen.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "./GlassCard";
import { useAuth } from "./AuthContext";

const LoginScreen = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const setField = (key) => (e) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleContinue = async () => {
    setError("");
    setSubmitting(true);
    const result = await login(form);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate("/buyer/home");
  };

  return (
    <div className="app-root">
      <main className="app-main">
        <div className="dashboard-header">
          <div>
            <h2 className="section-title">Log In</h2>
            <p className="section-subtitle">Welcome back to HaulYard.</p>
          </div>
        </div>

        <GlassCard className="dashboard-card">
          <div className="form-grid">
            {error ? <div className="form-error">{error}</div> : null}

            <div className="form-field">
              <div className="field-label">Email</div>
              <input
                className="field-input"
                type="email"
                autoCapitalize="none"
                placeholder="you@example.com"
                value={form.email}
                onChange={setField("email")}
              />
            </div>

            <div className="form-field">
              <div className="field-label">Password</div>
              <input
                className="field-input"
                type="password"
                placeholder="Your password"
                value={form.password}
                onChange={setField("password")}
                onKeyDown={(e) => e.key === "Enter" && handleContinue()}
              />
            </div>

            <button
              className="primary-button full-width"
              onClick={handleContinue}
              disabled={submitting}
            >
              {submitting ? "Signing in…" : "Continue"}
            </button>

            <div style={{ textAlign: "center" }}>
              <span
                style={{ color: "#86efac", cursor: "pointer", fontSize: 13, textDecoration: "underline" }}
                onClick={() => navigate("/forgot")}
              >
                Forgot password?
              </span>
            </div>
          </div>
        </GlassCard>

        <p style={{ marginTop: 16, fontSize: 13, opacity: 0.85, textAlign: "center" }}>
          No account yet?{" "}
          <span
            style={{ color: "#86efac", cursor: "pointer", textDecoration: "underline" }}
            onClick={() => navigate("/signup")}
          >
            Sign up
          </span>
        </p>

        <div style={{ marginTop: 12, textAlign: "center" }}>
          <button className="ghost-button" onClick={() => navigate("/")}>
            Back to Welcome
          </button>
        </div>
      </main>
    </div>
  );
};

export default LoginScreen;
