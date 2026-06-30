import React, { useState } from "react";
import GlassCard from "./GlassCard";
import { useAuth } from "./AuthContext";

// Shown instead of the app when a signed-in user hasn't verified their email.
export default function VerifyGate() {
  const { user, resendVerification, refreshUser, logout } = useAuth();
  const [sent, setSent] = useState(false);
  const [verifyUrl, setVerifyUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const resend = async () => {
    setBusy(true);
    const r = await resendVerification();
    setBusy(false);
    setSent(true);
    if (r.verifyUrl) setVerifyUrl(r.verifyUrl);
  };

  return (
    <div className="app-root">
      <main
        className="app-main"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          minHeight: "80vh",
        }}
      >
        <h2 className="section-title">Verify your email</h2>
        <GlassCard className="dashboard-card" style={{ marginTop: 12 }}>
          <div className="card-description" style={{ marginBottom: 12 }}>
            We sent a verification link to <strong>{user?.email}</strong>. Confirm
            your email to start using HaulYard.
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="primary-button" onClick={resend} disabled={busy}>
              {busy ? "Sending…" : "Resend email"}
            </button>
            <button className="ghost-button" onClick={refreshUser}>
              I’ve verified — refresh
            </button>
          </div>

          {verifyUrl ? (
            <div className="form-error" style={{ marginTop: 12 }}>
              Email isn’t configured in this environment, so here’s your link:{" "}
              <a href={verifyUrl} style={{ color: "#86efac", fontWeight: 600 }}>
                Verify now
              </a>
            </div>
          ) : sent ? (
            <p style={{ marginTop: 12, fontSize: 13, color: "#4ade80" }}>
              Sent — check your inbox, then tap “I’ve verified.”
            </p>
          ) : null}

          <div style={{ marginTop: 16 }}>
            <button className="ghost-button" onClick={logout}>
              Log out
            </button>
          </div>
        </GlassCard>
      </main>
    </div>
  );
}
