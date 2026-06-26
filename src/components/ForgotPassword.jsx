// src/components/ForgotPassword.jsx
//
// "Forgot password" request screen: enter your email, we send a reset link.
// In beta/no-SMTP mode the server returns the link directly so the flow works
// without a mail provider.

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "./GlassCard";
import { useAuth } from "./AuthContext";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [resetUrl, setResetUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    const res = await forgotPassword(email);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setResetUrl(res.resetUrl || "");
    setSent(true);
  };

  return (
    <div className="app-root">
      <main className="app-main">
        <div className="dashboard-header">
          <div>
            <h2 className="section-title">Reset password</h2>
            <p className="section-subtitle">
              Enter your email and we'll send a reset link.
            </p>
          </div>
        </div>

        <GlassCard className="dashboard-card">
          {sent ? (
            <div className="form-grid">
              <div className="card-description">
                If an account exists for <strong>{email}</strong>, a password
                reset link is on its way. The link is valid for 1 hour.
              </div>
              {resetUrl ? (
                <div className="card-description" style={{ marginTop: 8 }}>
                  <div style={{ marginBottom: 6, opacity: 0.85 }}>
                    No mail provider configured (beta) — use this link directly:
                  </div>
                  <button
                    className="primary-button full-width"
                    onClick={() => {
                      const u = new URL(resetUrl);
                      navigate(u.pathname + u.search);
                    }}
                  >
                    Set a new password
                  </button>
                </div>
              ) : null}
              <button className="ghost-button" onClick={() => navigate("/login")}>
                Back to Log In
              </button>
            </div>
          ) : (
            <div className="form-grid">
              {error ? <div className="form-error">{error}</div> : null}
              <div className="form-field">
                <div className="field-label">Email</div>
                <input
                  className="field-input"
                  type="email"
                  autoCapitalize="none"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
              </div>
              <button
                className="primary-button full-width"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Sending…" : "Send reset link"}
              </button>
              <div style={{ textAlign: "center" }}>
                <span
                  style={{ color: "#86efac", cursor: "pointer", fontSize: 13, textDecoration: "underline" }}
                  onClick={() => navigate("/login")}
                >
                  Back to Log In
                </span>
              </div>
            </div>
          )}
        </GlassCard>
      </main>
    </div>
  );
};

export default ForgotPassword;
