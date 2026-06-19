import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import GlassCard from "./GlassCard";
import BottomNav from "./BottomNav";
import RouteMiniMap from "./RouteMiniMap";
import { hasCoords } from "../lib/maps";

function formatDate(iso) {
  if (!iso) return "Not set";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Not set";
  return d.toLocaleString();
}

function Row({ label, value }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 12, opacity: 0.6 }}>{label}</div>
      <div style={{ fontSize: 14, marginTop: 2 }}>{value || "—"}</div>
    </div>
  );
}

export default function BuyerRequestDetails() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const request = state?.request;

  if (!request) {
    return (
      <div className="app-root">
        <main className="app-main">
          <h2 className="section-title">Request details</h2>
          <GlassCard className="dashboard-card" style={{ marginTop: 12 }}>
            <div className="card-description" style={{ marginBottom: 12 }}>
              No request selected. Open a request from your list first.
            </div>
            <button
              className="primary-button full-width"
              onClick={() => navigate("/buyer/requests")}
            >
              Back to requests
            </button>
          </GlassCard>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="app-root">
      <main className="app-main">
        <div className="dashboard-header">
          <div>
            <h2 className="section-title">Request details</h2>
            <p className="section-subtitle">Your submitted material request.</p>
          </div>
          <span
            className={`status-pill ${
              request.status === "accepted" ? "status-active" : "status-draft"
            }`}
          >
            {request.status || "open"}
          </span>
        </div>

        <GlassCard className="dashboard-card">
          <Row
            label="Material"
            value={`${request.material || "Unknown"} — ${request.quantity ?? ""} ${
              request.unit || ""
            }`.trim()}
          />
          <Row label="Delivery address" value={request.address} />
          <Row label="Notes" value={request.notes} />
          <Row label="Submitted" value={formatDate(request.createdAt)} />
        </GlassCard>

        {hasCoords(request) ? (
          <GlassCard className="dashboard-card" style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 8 }}>
              Delivery location
            </div>
            <RouteMiniMap
              pickup={{ lat: request.lat, lng: request.lng, label: request.address }}
              height={200}
            />
          </GlassCard>
        ) : null}

        <div style={{ marginTop: 16 }}>
          <button
            className="ghost-button"
            onClick={() => navigate("/buyer/requests")}
          >
            Back to requests
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
