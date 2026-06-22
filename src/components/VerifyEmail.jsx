import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "./GlassCard";
import { api } from "../lib/api";
import { useAuth } from "./AuthContext";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState("verifying"); // verifying | ok | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setStatus("error");
      setMessage("This link is missing its verification token.");
      return;
    }
    let active = true;
    api
      .get(`/auth/verify?token=${encodeURIComponent(token)}`)
      .then(() => {
        if (!active) return;
        setStatus("ok");
        refreshUser();
      })
      .catch((e) => {
        if (!active) return;
        setStatus("error");
        setMessage(e.message || "We couldn't verify this link.");
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="app-root">
      <main className="app-main">
        <h2 className="section-title" style={{ marginTop: 24 }}>
          Email verification
        </h2>
        <GlassCard className="dashboard-card" style={{ marginTop: 12 }}>
          {status === "verifying" ? (
            <div className="card-description">Verifying your email…</div>
          ) : status === "ok" ? (
            <>
              <div className="card-title" style={{ color: "#4ade80" }}>
                ✓ Email verified
              </div>
              <div className="card-description" style={{ margin: "8px 0 12px" }}>
                Thanks — your account is now verified.
              </div>
              <button
                className="primary-button full-width"
                onClick={() => navigate("/buyer/home")}
              >
                Continue
              </button>
            </>
          ) : (
            <>
              <div className="card-title">Couldn’t verify</div>
              <div className="card-description" style={{ margin: "8px 0 12px" }}>
                {message}
              </div>
              <button
                className="ghost-button"
                onClick={() => navigate("/")}
              >
                Back to start
              </button>
            </>
          )}
        </GlassCard>
      </main>
    </div>
  );
}
