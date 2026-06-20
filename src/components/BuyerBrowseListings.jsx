import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "./GlassCard";
import BottomNav from "./BottomNav";
import { useSellerListings } from "./SellerListingContext";
import { distanceMiles, geocodeAddress } from "../lib/maps";

export default function BuyerBrowseListings() {
  const navigate = useNavigate();
  const seller = useSellerListings();

  const listings = Array.isArray(seller.listings) ? seller.listings : [];

  const [query, setQuery] = useState("");
  const [material, setMaterial] = useState("All");

  // Proximity search: a buyer location to measure/sort listings against.
  const [locText, setLocText] = useState("");
  const [buyerLoc, setBuyerLoc] = useState(null);
  const [locating, setLocating] = useState(false);

  const materials = useMemo(() => {
    const set = new Set(listings.map((l) => l?.material).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [listings]);

  // Returns [{ l, dist }], sorted nearest-first when a buyer location is set.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = listings.filter((l) => {
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

    if (!buyerLoc) return matches.map((l) => ({ l, dist: null }));

    return matches
      .map((l) => ({
        l,
        dist: distanceMiles(buyerLoc, { lat: l?.lat, lng: l?.lng }),
      }))
      .sort((a, b) => (a.dist ?? Infinity) - (b.dist ?? Infinity));
  }, [listings, query, material, buyerLoc]);

  async function applyTextLocation() {
    const text = locText.trim();
    if (!text) {
      setBuyerLoc(null);
      return;
    }
    setLocating(true);
    const geo = await geocodeAddress(text);
    setLocating(false);
    setBuyerLoc(geo ? { lat: geo.lat, lng: geo.lng } : null);
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBuyerLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocText("My location");
        setLocating(false);
      },
      () => setLocating(false)
    );
  }

  function clearLocation() {
    setBuyerLoc(null);
    setLocText("");
  }

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

            <div className="form-field">
              <div className="field-label">Near a location (sorts by distance)</div>
              <input
                className="field-input"
                value={locText}
                onChange={(e) => setLocText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyTextLocation()}
                placeholder="Your city, zip, or jobsite"
              />
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                <button className="primary-button" onClick={applyTextLocation} disabled={locating}>
                  {locating ? "Locating…" : "Sort by distance"}
                </button>
                <button className="ghost-button" onClick={useMyLocation} disabled={locating}>
                  Use my location
                </button>
                {buyerLoc ? (
                  <button className="ghost-button" onClick={clearLocation}>
                    Clear
                  </button>
                ) : null}
              </div>
              {buyerLoc ? (
                <div style={{ marginTop: 6, fontSize: "0.78rem", color: "rgb(74,222,128)" }}>
                  Sorted by distance from your location.
                </div>
              ) : null}
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
            {filtered.map(({ l, dist }, idx) => {
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

                  {l?.sellerCompany || l?.sellerName ? (
                    <div style={{ marginTop: 4, fontSize: "0.78rem", opacity: 0.7 }}>
                      Posted by {l.sellerCompany || l.sellerName}
                      {l?.sellerRatingCount > 0 ? (
                        <span style={{ marginLeft: 6, color: "#facc15" }}>
                          ★ {l.sellerRating} ({l.sellerRatingCount})
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  {dist != null ? (
                    <div style={{ marginTop: 6, fontSize: "0.85rem", color: "rgb(74,222,128)", fontWeight: 600 }}>
                      ~{Math.round(dist)} mi away
                    </div>
                  ) : buyerLoc ? (
                    <div style={{ marginTop: 6, fontSize: "0.8rem", opacity: 0.6 }}>
                      Distance unavailable
                    </div>
                  ) : null}

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
