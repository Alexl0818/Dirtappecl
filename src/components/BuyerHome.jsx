import React from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "./GlassCard";
import BottomNav from "./BottomNav";
import "./BuyerHome.css";

export default function BuyerHome() {
  const navigate = useNavigate();

  return (
    <div className="app-root">
      <main className="app-main">
        <div className="dashboard-header">
          <div>
            <h2 className="section-title">Buyer</h2>
            <p className="section-subtitle">Create requests or browse listings.</p>
          </div>

          <button className="primary-button" onClick={() => navigate("/buyer/request")}>
            New Request
          </button>
        </div>

        <div className="dashboard-grid">
          <GlassCard className="dashboard-card" onClick={() => navigate("/buyer/request")}>
            <div className="card-title">Create Request</div>
            <div className="card-description">Post what material you need.</div>
          </GlassCard>

          <GlassCard className="dashboard-card" onClick={() => navigate("/buyer/requests")}>
            <div className="card-title">Your Requests</div>
            <div className="card-description">View requests you’ve submitted.</div>
          </GlassCard>

          <GlassCard className="dashboard-card" onClick={() => navigate("/buyer/browse")}>
            <div className="card-title">Browse Listings</div>
            <div className="card-description">See material posted by sellers.</div>
          </GlassCard>

          <GlassCard className="dashboard-card" onClick={() => navigate("/buyer/map")}>
            <div className="card-title">Map View</div>
            <div className="card-description">Map placeholder for later.</div>
          </GlassCard>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
