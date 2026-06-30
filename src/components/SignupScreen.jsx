// src/components/SignupScreen.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "./GlassCard";
import { useAuth } from "./AuthContext";

const SignupScreen = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    company: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const setField = (key) => (e) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleCreateAccount = async () => {
    setError("");
    setSubmitting(true);
    const result = await signup(form);
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
            <h2 className="section-title">Sign Up</h2>
            <p className="section-subtitle">Create your SoilConnect account.</p>
          </div>
        </div>

        <GlassCard className="dashboard-card">
          <div className="form-grid">
            {error ? <div className="form-error">{error}</div> : null}

            <div className="form-field">
              <div className="field-label">Name</div>
              <input
                className="field-input"
                placeholder="Your name"
                value={form.name}
                onChange={setField("name")}
              />
            </div>

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
                placeholder="At least 6 characters"
                value={form.password}
                onChange={setField("password")}
                onKeyDown={(e) => e.key === "Enter" && handleCreateAccount()}
              />
            </div>

            <div className="form-field">
              <div className="field-label">Company (optional)</div>
              <input
                className="field-input"
                placeholder="Company name"
                value={form.company}
                onChange={setField("company")}
              />
            </div>

            <button
              className="primary-button full-width"
              onClick={handleCreateAccount}
              disabled={submitting}
            >
              {submitting ? "Creating…" : "Create account"}
            </button>

            <p style={{ fontSize: 12, opacity: 0.75, textAlign: "center", margin: 0 }}>
              By creating an account, you agree to our{" "}
              <span
                style={{ color: "#86efac", cursor: "pointer", textDecoration: "underline" }}
                onClick={() => navigate("/terms")}
              >
                Terms
              </span>{" "}
              and{" "}
              <span
                style={{ color: "#86efac", cursor: "pointer", textDecoration: "underline" }}
                onClick={() => navigate("/privacy")}
              >
                Privacy Policy
              </span>
              .
            </p>
          </div>
        </GlassCard>

        <p style={{ marginTop: 16, fontSize: 13, opacity: 0.85, textAlign: "center" }}>
          Already have an account?{" "}
          <span
            style={{ color: "#86efac", cursor: "pointer", textDecoration: "underline" }}
            onClick={() => navigate("/login")}
          >
            Log in
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

export default SignupScreen;
