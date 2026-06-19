import React from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "./GlassCard";
import BottomNav from "./BottomNav";
import { useHaulBids } from "./HaulBidContext";

export default function HaulerDashboard() {
  const navigate = useNavigate();
  const haul = useHaulBids();

  const opps = Array.isArray(haul.opportunities) ? haul.opportunities : [];

  return (
    <div className="app-root">
      <main className="app-main">
        <div className="dashboard-header">
          <div>
            <h2 className="section-title">Haul</h2>
            <p className="section-subtitle">Open haul opportunities ready for bids.</p>
          </div>

          <button className="ghost-button" onClick={() => navigate("/mode")}>
            Switch Mode
          </button>
        </div>

        {opps.length === 0 ? (
          <GlassCard className="dashboard-card">
            <div className="card-title">No haul opportunities yet</div>
            <div className="card-description">
              When a seller accepts a request, it will create a haul opportunity here.
            </div>
          </GlassCard>
        ) : (
          <div className="dashboard-grid">
            {opps.map((o, idx) => {
              const id = o?.id ?? `opp_${idx}`;
              const mat = o?.material ?? "Unknown";
              const qty = o?.quantity ?? "";
              const unit = o?.unit ?? "";
              const pickup = o?.pickupLocation ?? "TBD";
              const dropoff = o?.dropoffAddress ?? "TBD";
              const createdAt = o?.createdAt ? new Date(o.createdAt).toLocaleString() : "";
              const status = o?.status ?? "open";

              return (
                <GlassCard key={id} className="dashboard-card">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div className="card-title">
                      {mat} — {qty} {unit}
                    </div>
                    <span
                      className={`status-pill ${
                        status === "open" ? "status-active" : "status-draft"
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="card-description" style={{ marginTop: 8 }}>
                    <div>
                      <strong>Pickup:</strong> {pickup}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <strong>Dropoff:</strong> {dropoff}
                    </div>
                    {createdAt ? (
                      <div style={{ marginTop: 8, opacity: 0.75, fontSize: "0.78rem" }}>
                        Created: {createdAt}
                      </div>
                    ) : null}
                  </div>

                  {o?.notes ? (
                    <div style={{ marginTop: 8, opacity: 0.85, fontSize: "0.85rem" }}>
                      {o.notes}
                    </div>
                  ) : null}

                  <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button className="primary-button" onClick={() => navigate(`/hauler/opportunity/${id}`)}>
                      Open
                    </button>

                    <button
                      className="ghost-button"
                      onClick={() => navigate(`/hauler/opportunity/${id}`)}
                    >
                      Place Bid
                    </button>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}

        {opps.length > 0 ? (
          <div style={{ marginTop: 18 }}>
            <button
              className="ghost-button"
              onClick={() => {
                if (confirm("Clear all haul opportunities?")) haul.clearOpportunities();
              }}
            >
              Clear Opportunities
            </button>

            <button
              className="ghost-button"
              style={{ marginLeft: 10 }}
              onClick={() => {
                if (confirm("Clear all haul bids?")) haul.clearBids();
              }}
            >
              Clear Bids
            </button>
          </div>
        ) : null}
      </main>

      <BottomNav />
    </div>
  );
}
