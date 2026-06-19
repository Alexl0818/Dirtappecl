import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

function formatDate(iso) {
  if (!iso) return "Not set";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Not set";
  return d.toLocaleString();
}

const screenStyle = {
  minHeight: "100vh",
  padding: "24px",
  background: "#111",
  color: "#fff",
};

const cardStyle = {
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 12,
  padding: 16,
  background: "rgba(255,255,255,0.04)",
  maxWidth: 640,
};

const labelStyle = { opacity: 0.6, fontSize: 12, marginTop: 12 };
const valueStyle = { fontSize: 15, marginTop: 2 };

function Row({ label, value }) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>{value || "—"}</div>
    </div>
  );
}

export default function BuyerRequestDetails() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const request = state?.request;

  if (!request) {
    return (
      <div style={screenStyle}>
        <h1>Request details</h1>
        <p style={{ opacity: 0.8 }}>
          No request selected. Open a request from your list first.
        </p>
        <button onClick={() => navigate("/buyer/requests")}>
          Back to requests
        </button>
      </div>
    );
  }

  return (
    <div style={screenStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Request details</h1>
        <span style={{ opacity: 0.75 }}>{request.status || "open"}</span>
      </div>

      <div style={{ ...cardStyle, marginTop: 16 }}>
        <Row
          label="Material"
          value={`${request.material || "Unknown"} — ${request.quantity ?? ""} ${
            request.unit || ""
          }`.trim()}
        />
        <Row label="Delivery address" value={request.address} />
        <Row label="Notes" value={request.notes} />
        <Row label="Request ID" value={request.id} />
        <Row label="Linked listing" value={request.listingId} />
        <Row label="Submitted" value={formatDate(request.createdAt)} />
      </div>

      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        <button onClick={() => navigate("/buyer/requests")}>
          Back to requests
        </button>
      </div>
    </div>
  );
}
