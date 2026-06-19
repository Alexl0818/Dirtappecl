import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import GlassCard from "./GlassCard";
import { useMessages } from "./MessageContext";

export default function MessageThread() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const inquiry = state?.inquiry;

  const { threads, sendMessage, loadThread } = useMessages();
  const inquiryId = inquiry?.id || "TEMP-THREAD";

  const [draft, setDraft] = useState("");

  const messages = threads[inquiryId] || [];

  // Load this thread's messages from the server when it opens.
  useEffect(() => {
    if (inquiry?.id) loadThread(inquiry.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inquiry?.id]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    sendMessage(inquiryId, { from: "seller", text: draft.trim() });
    setDraft("");
  };

  if (!inquiry) {
    return (
      <div className="app-root">
        <main className="app-main">
          <h2 className="section-title">Messages</h2>
          <GlassCard className="dashboard-card" style={{ marginTop: 12 }}>
            <div className="card-description" style={{ marginBottom: 12 }}>
              No conversation selected. Go back and open an inquiry first.
            </div>
            <button className="ghost-button" onClick={() => navigate(-1)}>
              Back
            </button>
          </GlassCard>
        </main>
      </div>
    );
  }

  return (
    <div className="app-root">
      <main className="app-main">
        <div className="dashboard-header">
          <div>
            <h2 className="section-title">Message buyer</h2>
            <p className="section-subtitle">
              You’re messaging {inquiry.buyerName || "the buyer"}.
            </p>
          </div>
        </div>

        {/* Inquiry summary */}
        <GlassCard className="dashboard-card" style={{ marginBottom: 12 }}>
          <div className="card-title">
            {inquiry.material || "Material"}
            {inquiry.quantity ? ` • ${inquiry.quantity} ${inquiry.unit || ""}` : ""}
          </div>
          {inquiry.location ? (
            <div className="card-description" style={{ marginTop: 4 }}>
              {inquiry.location}
            </div>
          ) : null}
        </GlassCard>

        {/* Messages */}
        <GlassCard
          className="dashboard-card"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            minHeight: 180,
          }}
        >
          {messages.length === 0 ? (
            <div style={{ fontSize: 13, opacity: 0.7 }}>
              No messages yet. Start the conversation.
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.fromRole === "seller" ? "flex-end" : "flex-start",
                  maxWidth: "80%",
                  padding: "8px 11px",
                  borderRadius: 14,
                  fontSize: 13,
                  lineHeight: "18px",
                  background:
                    m.fromRole === "seller"
                      ? "linear-gradient(135deg, #22c55e, #16a34a)"
                      : "rgba(255,255,255,0.1)",
                  color: m.fromRole === "seller" ? "#04210f" : "#f5f5f5",
                }}
              >
                {m.text}
              </div>
            ))
          )}
        </GlassCard>

        {/* Composer */}
        <form
          onSubmit={handleSend}
          style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}
        >
          <input
            className="input"
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message…"
            style={{ flex: 1, borderRadius: 999 }}
          />
          <button className="btn btn-primary" type="submit">
            Send
          </button>
        </form>

        <div style={{ marginTop: 12 }}>
          <button className="ghost-button" onClick={() => navigate(-1)}>
            Back to inquiry
          </button>
        </div>
      </main>
    </div>
  );
}
