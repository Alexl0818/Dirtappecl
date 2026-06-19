import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "./GlassCard";
import BottomNav from "./BottomNav";
import { useInquiry } from "./InquiryContext";
import { useSellerListings } from "./SellerListingContext";
import "./BuyerHome.css";

export default function BuyerHome() {
  const navigate = useNavigate();
  const { requests } = useInquiry();
  const { listings } = useSellerListings();

  const stats = useMemo(() => {
    const safeRequests = Array.isArray(requests) ? requests : [];
    const safeListings = Array.isArray(listings) ? listings : [];
    return {
      requests: safeRequests.length,
      available: safeListings.filter((l) => (l?.status ?? "active") === "active").length,
    };
  }, [requests, listings]);

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

        <div className="dashboard-grid kpi-grid">
          <GlassCard className="dashboard-card kpi-card">
            <div className="kpi-value">{stats.requests}</div>
            <div className="kpi-label">Your requests</div>
          </GlassCard>
          <GlassCard className="dashboard-card kpi-card">
            <div className="kpi-value">{stats.available}</div>
            <div className="kpi-label">Listings available</div>
          </GlassCard>
        </div>

        <div className="dashboard-grid">
          <GlassCard className="dashboard-card nav-card" onClick={() => navigate("/buyer/request")}>
            <div className="card-title">Create Request</div>
            <div className="card-description">Post what material you need.</div>
          </GlassCard>

          <GlassCard className="dashboard-card nav-card" onClick={() => navigate("/buyer/requests")}>
            <div className="card-title">Your Requests</div>
            <div className="card-description">View requests you’ve submitted.</div>
          </GlassCard>

          <GlassCard className="dashboard-card nav-card" onClick={() => navigate("/buyer/browse")}>
            <div className="card-title">Browse Listings</div>
            <div className="card-description">See material posted by sellers.</div>
          </GlassCard>

          <GlassCard className="dashboard-card nav-card" onClick={() => navigate("/buyer/map")}>
            <div className="card-title">Map View</div>
            <div className="card-description">Browse available material on a map.</div>
          </GlassCard>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
