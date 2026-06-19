import React from "react";
import { useNavigate } from "react-router-dom";

import GlassCard from "./GlassCard";
import BottomNav from "./BottomNav";

export default function SellerDashboard() {
  const navigate = useNavigate();

  return (
    <div className="app-root">
      <main className="app-main seller-dashboard">
        <div className="dashboard-header">
          <div>
            <h2 className="section-title">Seller</h2>
            <p className="section-subtitle">Manage listings and respond to requests.</p>
          </div>

          <button className="primary-button" onClick={() => navigate("/seller/new")}>
            New Listing
          </button>
        </div>

        <div className="dashboard-grid">
          <GlassCard className="dashboard-card" onClick={() => navigate("/seller/new")}>
            <div className="card-title">Create Listing</div>
            <div className="card-description">
              Post available material and delivery details.
            </div>
          </GlassCard>

          <GlassCard className="dashboard-card" onClick={() => navigate("/seller/listing")}>
            <div className="card-title">Listing Details</div>
            <div className="card-description">
              View and manage your active listings.
            </div>
          </GlassCard>

          <GlassCard className="dashboard-card" onClick={() => navigate("/seller/listing")}>
            <div className="card-title">Inquiry Details</div>
            <div className="card-description">
              Open a listing to review its buyer requests.
            </div>
          </GlassCard>

          <GlassCard className="dashboard-card" onClick={() => navigate("/mode")}>
            <div className="card-title">Switch Mode</div>
            <div className="card-description">Go back to Buyer / Hauler selection.</div>
          </GlassCard>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
