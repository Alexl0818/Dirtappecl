// src/components/FeedbackScreen.jsx
//
// In-app beta feedback. Sends to POST /api/feedback, which stores it and emails
// the owner. Reachable from Profile and the beta welcome note.

import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import GlassCard from "./GlassCard";
import BottomNav from "./BottomNav";
import { api } from "../lib/api";

export default function FeedbackScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "";

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSend = async () => {
    setError("");
    if (!message.trim()) {
      setError("Please enter your feedback.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/feedback", { message: message.trim(), page: from });
      setSent(true);
    } catch (e) {
      setError(e.message || "Couldn't send feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-root">
      <main className="app-main" style={{ maxWidth: 600, margin: "0 auto", paddingBottom: 90 }}>
        <div className="dashboard-header">
          <div>
            <h2 className="section-title">Send feedback</h2>
            <p className="section-subtitle">Help shape HaulYard — tell us what works or what's broken.</p>
          </div>
        </div>

        <GlassCard className="dashboard-card">
          {sent ? (
            <div className="form-grid">
              <div className="card-description">
                🙏 Thanks! Your feedback was sent to the HaulYard team. We read every note.
              </div>
              <button className="primary-button full-width" onClick={() => navigate("/buyer/home")}>
                Back to the app
              </button>
            </div>
          ) : (
            <div className="form-grid">
              {error ? <div className="form-error">{error}</div> : null}
              <div className="form-field">
                <div className="field-label">Your feedback</div>
                <textarea
                  className="field-input"
                  rows={6}
                  style={{ resize: "vertical", minHeight: 120 }}
                  placeholder="What did you like? What was confusing or broken? What would make this more useful?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={4000}
                />
              </div>
              <button
                className="primary-button full-width"
                onClick={handleSend}
                disabled={submitting}
              >
                {submitting ? "Sending…" : "Send feedback"}
              </button>
              <div style={{ textAlign: "center" }}>
                <button className="ghost-button" onClick={() => navigate(-1)}>Cancel</button>
              </div>
            </div>
          )}
        </GlassCard>
      </main>
      <BottomNav />
    </div>
  );
}
