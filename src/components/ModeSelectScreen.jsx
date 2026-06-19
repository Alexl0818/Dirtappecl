import React from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "./GlassCard";

export default function ModeSelectScreen() {
  const navigate = useNavigate();

  return (
    <div className="app-root">
      <main className="app-main">
        <div className="dashboard-header">
          <div>
            <h2 className="section-title">Choose your role</h2>
            <p className="section-subtitle">
              Pick how you want to use SoilConnect — you can switch anytime.
            </p>
          </div>
        </div>

        <div className="dashboard-grid">
          <GlassCard
            className="dashboard-card nav-card"
            onClick={() => navigate("/buyer/home")}
          >
            <div className="card-title">Buyer</div>
            <div className="card-description">
              Find and request soil material for your site.
            </div>
          </GlassCard>

          <GlassCard
            className="dashboard-card nav-card"
            onClick={() => navigate("/seller/dashboard")}
          >
            <div className="card-title">Seller</div>
            <div className="card-description">
              Post material you have and respond to buyer requests.
            </div>
          </GlassCard>

          <GlassCard
            className="dashboard-card nav-card"
            onClick={() => navigate("/hauler/dashboard")}
          >
            <div className="card-title">Hauler</div>
            <div className="card-description">
              Bid on haul opportunities and move material.
            </div>
          </GlassCard>
        </div>

        <div style={{ marginTop: 16 }}>
          <button className="ghost-button" onClick={() => navigate("/")}>
            Back to welcome
          </button>
        </div>
      </main>
    </div>
  );
}
