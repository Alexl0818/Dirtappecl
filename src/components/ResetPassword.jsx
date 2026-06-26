// src/components/ResetPassword.jsx
//
// Lands here from the emailed reset link (/reset?token=…). Sets a new password,
// then sends the user to Log In. All existing sessions are invalidated server-side.

import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import GlassCard from "./GlassCard";
import { useAuth } from "./AuthContext";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    const res = await resetPassword(token, password);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setDone(true);
  };

  return (
    <div className="app-root">
      <main className="app-main">
        <div className="dashboard-header">
          <div>
            <h2 className="section-title">Set a new password</h2>
            <p className="section-subtitle">Choose a new password for your account.</p>
          </div>
        </div>

        <GlassCard className="dashboard-card">
          {!token ? (
            <div className="form-grid">
              <div className="form-error">This reset link is missing its token.</div>
              <button className="ghost-button" onClick={() => navigate("/forgot")}>
                Request a new link
              </button>
            </div>
          ) : done ? (
            <div className="form-grid">
              <div className="card-description">
                Your password has been updated. You can now log in with it.
              </div>
              <button className="primary-button full-width" onClick={() => navigate("/login")}>
                Go to Log In
              </button>
            </div>
          ) : (
            <div className="form-grid">
              {error ? <div className="form-error">{error}</div> : null}
              <div className="form-field">
                <div className="field-label">New password</div>
                <input
                  className="field-input"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="form-field">
                <div className="field-label">Confirm password</div>
                <input
                  className="field-input"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
              </div>
              <button
                className="primary-button full-width"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Updating…" : "Update password"}
              </button>
            </div>
          )}
        </GlassCard>
      </main>
    </div>
  );
};

export default ResetPassword;
