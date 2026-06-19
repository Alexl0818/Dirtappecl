import React from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "./GlassCard";
import BottomNav from "./BottomNav";
import { useSellerListings } from "./SellerListingContext";

export default function ListingDetails() {
  const navigate = useNavigate();
  const seller = useSellerListings();

  const listings = Array.isArray(seller.listings) ? seller.listings : [];

  return (
    <div className="app-root">
      <main className="app-main">
        <div className="dashboard-header">
          <div>
            <h2 className="section-title">Your Listings</h2>
            <p className="section-subtitle">Active and draft listings you’ve posted.</p>
          </div>

          <button className="primary-button" onClick={() => navigate("/seller/new")}>
            New Listing
          </button>
        </div>

        {listings.length === 0 ? (
          <GlassCard className="dashboard-card">
            <div className="card-title">No listings yet</div>
            <div className="card-description" style={{ marginBottom: 12 }}>
              Create your first listing to start receiving buyer requests.
            </div>

            <button className="primary-button full-width" onClick={() => navigate("/seller/new")}>
              Create Listing
            </button>
          </GlassCard>
        ) : (
          <div className="dashboard-grid">
            {listings.map((l, idx) => {
              const id = l?.id ?? `row_${idx}`;
              const material = l?.material ?? "Unknown";
              const qty = l?.quantity ?? "";
              const unit = l?.unit ?? "";
              const location = l?.location ?? "";
              const status = l?.status ?? "active";
              const createdAt = l?.createdAt ? new Date(l.createdAt).toLocaleString() : "";

              return (
                <GlassCard key={id} className="dashboard-card">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div className="card-title">
                      {material} — {qty} {unit}
                    </div>

                    <span
                      className={`status-pill ${
                        status === "active" ? "status-active" : "status-draft"
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="card-description" style={{ marginTop: 8 }}>
                    {location}
                    {createdAt ? (
                      <div style={{ marginTop: 6, opacity: 0.75, fontSize: "0.78rem" }}>
                        Created: {createdAt}
                      </div>
                    ) : null}
                  </div>

                  {l?.price ? (
                    <div style={{ marginTop: 8, fontSize: "0.9rem", opacity: 0.9 }}>
                      Price: {l.price}
                    </div>
                  ) : null}

                  {l?.notes ? (
                    <div style={{ marginTop: 8, fontSize: "0.85rem", opacity: 0.85 }}>
                      {l.notes}
                    </div>
                  ) : null}

                  <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      className="primary-button"
                      onClick={() => navigate(`/seller/inquiry/${id}`)}
                    >
                      View Requests
                    </button>

                    <button
                      className="ghost-button"
                      onClick={() => navigate(`/seller/edit/${id}`)}
                    >
                      Edit
                    </button>

                    <button
                      className="ghost-button"
                      onClick={() =>
                        seller.updateListing(id, {
                          status: status === "active" ? "paused" : "active",
                        })
                      }
                    >
                      {status === "active" ? "Pause" : "Activate"}
                    </button>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}

        {listings.length > 0 ? (
          <div style={{ marginTop: 18 }}>
            <button
              className="ghost-button"
              onClick={() => {
                if (confirm("Clear all seller listings?")) seller.clearListings();
              }}
            >
              Clear All Listings
            </button>
          </div>
        ) : null}
      </main>

      <BottomNav />
    </div>
  );
}
