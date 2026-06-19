import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "./GlassCard";
import BottomNav from "./BottomNav";
import { useSellerListings } from "./SellerListingContext";

export default function BuyerBrowseListings() {
  const navigate = useNavigate();
  const seller = useSellerListings();

  const listings = Array.isArray(seller.listings) ? seller.listings : [];

  const [query, setQuery] = useState("");
  const [material, setMaterial] = useState("All");

  const materials = useMemo(() => {
    const set = new Set(listings.map((l) => l?.material).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [listings]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter((l) => {
      const matOk = material === "All" || (l?.material || "") === material;

      const hay = [
        l?.material,
        l?.location,
        l?.notes,
        l?.price,
        String(l?.quantity ?? ""),
        l?.unit,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const qOk = !q || hay.includes(q);
      return matOk && qOk;
    });
  }, [listings, query, material]);

  return (
    <div className="app-root">
      <main className="app-main">
        <div className="dashboard-header">
          <div>
            <h2 className="section-title">Browse Listings</h2>
            <p className="section-subtitle">See material currently posted by sellers.</p>
          </div>

          <button className="ghost-button" onClick={() => navigate("/buyer/home")}>
            Back
          </button>
        </div>

        <GlassCard className="dashboard-card" style={{ marginBottom: 12 }}>
          <div className="form-grid">
            <div className="form-field">
              <div className="field-label">Search</div>
              <input
                className="field-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Material, location, notes, price…"
              />
            </div>

            <div className="form-field">
              <div className="field-label">Material</div>
              <select
                className="field-input"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
              >
                {materials.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </GlassCard>

        {filtered.length === 0 ? (
          <GlassCard className="dashboard-card">
            <div className="card-title">No listings found</div>
            <div className="card-description">
              Try changing the filter/search, or check back later.
            </div>
          </GlassCard>
        ) : (
          <div className="dashboard-grid">
            {filtered.map((l, idx) => {
              const id = l?.id ?? `row_${idx}`;
              const mat = l?.material ?? "Unknown";
              const qty = l?.quantity ?? "";
              const unit = l?.unit ?? "";
              const location = l?.location ?? "";
              const price = l?.price ?? "";
              const notes = l?.notes ?? "";
              const status = l?.status ?? "active";

              return (
                <GlassCard key={id} className="dashboard-card">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div className="card-title">
                      {mat} — {qty} {unit}
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
                  </div>

                  {price ? (
                    <div style={{ marginTop: 8, fontSize: "0.9rem", opacity: 0.9 }}>
                      Price: {price}
                    </div>
                  ) : null}

                  {notes ? (
                    <div style={{ marginTop: 8, fontSize: "0.85rem", opacity: 0.85 }}>
                      {notes}
                    </div>
                  ) : null}

                  <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                    <button
                      className="primary-button"
                      onClick={() => navigate(`/buyer/request/${id}`)}
                    >
                      Request This
                    </button>

                    <button
                      className="ghost-button"
                      onClick={() => navigate(`/buyer/details/${id}`)}
                    >
                      Details
                    </button>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
