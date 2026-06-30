// src/components/WelcomeBanner.jsx
//
// One-time beta welcome shown on the buyer home until dismissed. Explains it's a
// beta and points to the feedback channel. Dismissal persists in localStorage.

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const KEY = "dirtapp_welcome_dismissed";

export default function WelcomeBanner() {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(KEY) === "1";
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  return (
    <div
      style={{
        position: "relative",
        background: "linear-gradient(135deg, rgba(34,197,94,0.18), rgba(15,23,42,0.6))",
        border: "1px solid rgba(74,222,128,0.4)",
        borderRadius: 12,
        padding: "14px 40px 14px 16px",
        marginBottom: 14,
      }}
    >
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        style={{
          position: "absolute",
          top: 8,
          right: 10,
          background: "transparent",
          border: "none",
          color: "white",
          opacity: 0.7,
          fontSize: 18,
          cursor: "pointer",
          lineHeight: 1,
        }}
      >
        ×
      </button>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>👋 Welcome to the SoilConnect beta!</div>
      <div style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.5 }}>
        Thanks for trying it early. Things may still be rough around the edges — if anything’s
        confusing or broken, your feedback genuinely shapes what we build next.
      </div>
      <button
        className="primary-button"
        style={{ marginTop: 10 }}
        onClick={() => navigate("/feedback", { state: { from: "/buyer/home" } })}
      >
        Send feedback
      </button>
    </div>
  );
}
