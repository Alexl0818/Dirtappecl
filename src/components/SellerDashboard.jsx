import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import GlassCard from "./GlassCard";
import BottomNav from "./BottomNav";
import { useSellerListings } from "./SellerListingContext";
import { useInquiry } from "./InquiryContext";
import { useHaulBids } from "./HaulBidContext";
import { useAuth } from "./AuthContext";

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { listings } = useSellerListings();
  const { requests } = useInquiry();
  const { opportunities } = useHaulBids();
  const { user } = useAuth();

  const stats = useMemo(() => {
    const myListings = (Array.isArray(listings) ? listings : []).filter(
      (l) => !l.sellerEmail || l.sellerEmail === user?.email
    );
    const safeRequests = Array.isArray(requests) ? requests : [];
    const safeOpps = Array.isArray(opportunities) ? opportunities : [];
    const listingIds = new Set(myListings.map((l) => String(l?.id)));
    return {
      active: myListings.filter((l) => (l?.status ?? "active") === "active").length,
      requests: safeRequests.filter((r) => listingIds.has(String(r?.listingId))).length,
      awarded: safeOpps.filter(
        (o) => o?.status === "awarded" && listingIds.has(String(o?.listingId))
      ).length,
    };
  }, [listings, requests, opportunities, user]);

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

        <div className="dashboard-grid kpi-grid">
          <GlassCard className="dashboard-card kpi-card">
            <div className="kpi-value">{stats.active}</div>
            <div className="kpi-label">Active listings</div>
          </GlassCard>
          <GlassCard className="dashboard-card kpi-card">
            <div className="kpi-value">{stats.requests}</div>
            <div className="kpi-label">Buyer requests</div>
          </GlassCard>
          <GlassCard className="dashboard-card kpi-card">
            <div className="kpi-value">{stats.awarded}</div>
            <div className="kpi-label">Awarded hauls</div>
          </GlassCard>
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
