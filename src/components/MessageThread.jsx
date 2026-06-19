import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import GlassCard from "./GlassCard";
import { useMessages } from "./MessageContext";

export default function MessageThread() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const inquiry = state?.inquiry;

  const { threads, sendMessage } = useMessages();
  const inquiryId = inquiry?.id || "TEMP-THREAD";

  const [draft, setDraft] = useState("");

  const messages = threads[inquiryId] || [];

  const handleSend = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;

    sendMessage(inquiryId, {
      from: "seller",
      text: draft.trim(),
      sentAt: new Date().toISOString(),
    });

    setDraft("");
  };

  if (!inquiry) {
    return (
      <div
        style={{
          maxWidth: "480px",
          margin: "0 auto",
          padding: "16px 16px 80px",
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>Messages</h1>
        <p style={{ marginTop: 4, opacity: 0.7 }}>
          No inquiry selected. Go back and open an inquiry first.
        </p>
        <button
          onClick={() => navigate(-1)}
          style={{
            marginTop: 20,
            width: "100%",
            padding: "12px 0",
            borderRadius: 12,
            border: "1px solid #ffffff25",
            background: "transparent",
            color: "#fff",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "480px",
        margin: "0 auto",
        padding: "16px 16px 80px",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <h1 style={{ fontSize: 22, fontWeight: 600 }}>Message buyer</h1>
      <p style={{ marginTop: 4, opacity: 0.7 }}>
        You’re messaging: {inquiry.buyerName || "Buyer"}
      </p>

      {/* Inquiry summary */}
      <GlassCard style={{ marginTop: 16, padding: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>
          {inquiry.material || "Material"}{" "}
          {inquiry.quantity ? `• ${inquiry.quantity}` : ""}
        </div>
        {inquiry.location && (
          <div style={{ fontSize: 12, opacity: 0.7 }}>{inquiry.location}</div>
        )}
        <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>
          Need by: {inquiry.requestedDate || "Date TBD"}
        </div>
      </GlassCard>

      {/* Messages */}
      <GlassCard
        style={{
          marginTop: 16,
          padding: 12,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          minHeight: 160,
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
                alignSelf: m.from === "seller" ? "flex-end" : "flex-start",
                maxWidth: "80%",
                padding: "8px 10px",
                borderRadius: 12,
                fontSize: 13,
                lineHeight: "18px",
                background:
                  m.from === "seller" ? "#3498db" : "#ffffff15",
                color: "#fff",
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
        style={{
          marginTop: 12,
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 999,
            border: "1px solid #ffffff30",
            background: "#00000040",
            color: "#fff",
            fontSize: 14,
          }}
        />
        <button
          type="submit"
          style={{
            padding: "10px 14px",
            borderRadius: 999,
            border: "none",
            background: "#3498db",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Send
        </button>
      </form>

      <button
        onClick={() => navigate(-1)}
        style={{
          marginTop: 8,
          width: "100%",
          padding: "10px 0",
          borderRadius: 12,
          border: "1px solid #ffffff25",
          background: "transparent",
          color: "#fff",
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        Back to inquiry
      </button>
    </div>
  );
}
