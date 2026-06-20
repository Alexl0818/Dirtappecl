import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "./GlassCard";
import BottomNav from "./BottomNav";
import { useHaulBids } from "./HaulBidContext";
import { useAuth } from "./AuthContext";
import { distanceMiles } from "../lib/maps";

export default function HaulerDashboard() {
  const navigate = useNavigate();
  const haul = useHaulBids();
  const { user } = useAuth();

  const opps = Array.isArray(haul.opportunities) ? haul.opportunities : [];
  const allBids = Array.isArray(haul.bids) ? haul.bids : [];

  const openOpps = useMemo(
    () => opps.filter((o) => (o?.status ?? "open") === "open"),
    [opps]
  );
  const myBids = useMemo(
    () => allBids.filter((b) => b.haulerEmail === user?.email),
    [allBids, user]
  );
  const oppById = (id) => opps.find((o) => String(o.id) === String(id)) || null;

  const stats = {
    open: openOpps.length,
    bids: myBids.length,
    won: myBids.filter((b) => b.status === "awarded").length,
  };

  const oppDistance = (o) =>
    distanceMiles(
      { lat: o?.pickupLat, lng: o?.pickupLng },
      { lat: o?.dropoffLat, lng: o?.dropoffLng }
    );

  return (
    <div className="app-root">
      <main className="app-main">
        <div className="dashboard-header">
          <div>
            <h2 className="section-title">Haul</h2>
            <p className="section-subtitle">Open opportunities and your bids.</p>
          </div>
          <button className="ghost-button" onClick={() => navigate("/mode")}>
            Switch Mode
          </button>
        </div>

        <div className="dashboard-grid kpi-grid">
          <GlassCard className="dashboard-card kpi-card">
            <div className="kpi-value">{stats.open}</div>
            <div className="kpi-label">Open opportunities</div>
          </GlassCard>
          <GlassCard className="dashboard-card kpi-card">
            <div className="kpi-value">{stats.bids}</div>
            <div className="kpi-label">Your bids</div>
          </GlassCard>
          <GlassCard className="dashboard-card kpi-card">
            <div className="kpi-value">{stats.won}</div>
            <div className="kpi-label">Jobs won</div>
          </GlassCard>
        </div>

        {/* OPEN OPPORTUNITIES ----------------------------------------- */}
        <h3 className="section-title" style={{ fontSize: "1rem", marginBottom: 10 }}>
          Open opportunities
        </h3>
        {openOpps.length === 0 ? (
          <GlassCard className="dashboard-card">
            <div className="card-title">No open opportunities</div>
            <div className="card-description">
              When a seller accepts a buyer request, a haul opportunity appears here.
            </div>
          </GlassCard>
        ) : (
          <div className="dashboard-grid">
            {openOpps.map((o, idx) => {
              const id = o?.id ?? `opp_${idx}`;
              const dist = oppDistance(o);
              return (
                <GlassCard key={id} className="dashboard-card">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div className="card-title">
                      {o?.material ?? "Unknown"} — {o?.quantity ?? ""} {o?.unit ?? ""}
                    </div>
                    <span className="status-pill status-active">open</span>
                  </div>
                  <div className="card-description" style={{ marginTop: 8 }}>
                    <div>
                      <strong>Pickup:</strong> {o?.pickupLocation ?? "TBD"}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <strong>Dropoff:</strong> {o?.dropoffAddress ?? "TBD"}
                    </div>
                    {dist != null ? (
                      <div style={{ marginTop: 6, color: "rgb(74,222,128)", fontWeight: 600 }}>
                        ~{Math.round(dist)} mi haul
                      </div>
                    ) : null}
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <button
                      className="primary-button"
                      onClick={() => navigate(`/hauler/opportunity/${id}`)}
                    >
                      Open &amp; Bid
                    </button>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}

        {/* YOUR BIDS -------------------------------------------------- */}
        {myBids.length > 0 ? (
          <>
            <h3
              className="section-title"
              style={{ fontSize: "1rem", margin: "22px 0 10px" }}
            >
              Your bids
            </h3>
            <div className="dashboard-grid">
              {myBids.map((b, idx) => {
                const o = oppById(b.oppId);
                const won = b.status === "awarded";
                const lost = b.status === "rejected";
                const delivered = won && o?.status === "completed";
                const label = delivered
                  ? "Delivered"
                  : won
                  ? "Won"
                  : lost
                  ? "Not selected"
                  : "Pending";
                const dist = o ? oppDistance(o) : null;
                return (
                  <GlassCard key={b.id ?? `bid_${idx}`} className="dashboard-card">
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div className="card-title">
                        {o ? `${o.material} — ${o.quantity} ${o.unit}` : "Opportunity"}
                      </div>
                      <span
                        className={`status-pill ${won ? "status-active" : "status-draft"}`}
                      >
                        {label}
                      </span>
                    </div>
                    <div className="card-description" style={{ marginTop: 8 }}>
                      {o ? (
                        <div>
                          {o.pickupLocation} → {o.dropoffAddress}
                          {dist != null ? ` • ~${Math.round(dist)} mi` : ""}
                        </div>
                      ) : null}
                      <div style={{ marginTop: 6 }}>
                        <strong>Your bid:</strong> ${b.amount}
                        {b.availability ? ` • ${b.availability}` : ""}
                      </div>
                    </div>
                    {o ? (
                      <div style={{ marginTop: 12 }}>
                        <button
                          className="ghost-button"
                          onClick={() => navigate(`/hauler/opportunity/${o.id}`)}
                        >
                          View
                        </button>
                      </div>
                    ) : null}
                  </GlassCard>
                );
              })}
            </div>
          </>
        ) : null}

        {(opps.length > 0 || myBids.length > 0) ? (
          <div style={{ marginTop: 18 }}>
            <button
              className="ghost-button"
              onClick={() => {
                if (window.confirm("Clear your haul bids?")) haul.clearBids();
              }}
            >
              Clear My Bids
            </button>
          </div>
        ) : null}
      </main>

      <BottomNav />
    </div>
  );
}
