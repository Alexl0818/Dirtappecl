import React from "react";
import { useNavigate } from "react-router-dom";
import { useInquiry } from "./InquiryContext";

export default function BuyerRequests() {
  const navigate = useNavigate();
  const inquiry = useInquiry();

  const requests = Array.isArray(inquiry.requests) ? inquiry.requests : [];

  return (
    <div style={{ minHeight: "100vh", background: "#222", color: "white", padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <h1 style={{ margin: 0 }}>Buyer Requests</h1>
        <div style={{ opacity: 0.7 }}>({requests.length} total)</div>
      </div>

      <p style={{ opacity: 0.85 }}>Your submitted material requests.</p>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <button onClick={() => navigate("/buyer/request")}>New Request</button>
        <button onClick={() => navigate("/buyer/home")}>Back</button>
      </div>

      {requests.length === 0 ? (
        <div style={{ opacity: 0.85 }}>
          <p>No requests yet.</p>
          <button onClick={() => navigate("/buyer/request")}>Create your first request</button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12, maxWidth: 720 }}>
          {requests.map((r) => {
            const id = r?.id ?? `req_${Math.random().toString(36).slice(2)}`;
            const material = r?.material ?? "Unknown";
            const qty = r?.quantity ?? "";
            const unit = r?.unit ?? "";
            const address = r?.address ?? "";
            const status = r?.status ?? "open";
            const createdAt = r?.createdAt
              ? new Date(r.createdAt).toLocaleString()
              : "";

            return (
              <div
                key={id}
                style={{
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 10,
                  padding: 12,
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontWeight: 700 }}>
                    {material} — {qty} {unit}
                  </div>
                  <div style={{ opacity: 0.75 }}>{status}</div>
                </div>

                {address ? <div style={{ marginTop: 6, opacity: 0.9 }}>{address}</div> : null}
                {createdAt ? <div style={{ marginTop: 6, opacity: 0.65 }}>{createdAt}</div> : null}

                <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                  <button
                    onClick={() =>
                      navigate("/buyer/request-details", { state: { request: r } })
                    }
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {requests.length > 0 ? (
        <div style={{ marginTop: 18 }}>
          <button
            onClick={() => {
              if (confirm("Clear all requests?")) inquiry.clearRequests();
            }}
          >
            Clear All Requests
          </button>
        </div>
      ) : null}
    </div>
  );
}
