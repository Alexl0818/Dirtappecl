// src/components/BuyerMapView.jsx

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Map, Marker, InfoWindow } from "@vis.gl/react-google-maps";
import GlassCard from "./GlassCard";
import BottomNav from "./BottomNav";
import { useSellerListings } from "./SellerListingContext";
import { hasMapsKey, hasCoords, DEFAULT_CENTER, DEFAULT_ZOOM } from "../lib/maps";

export default function BuyerMapView() {
  const navigate = useNavigate();
  const seller = useSellerListings();
  const [selected, setSelected] = useState(null);

  const active = useMemo(
    () =>
      (Array.isArray(seller.listings) ? seller.listings : []).filter(
        (l) => (l?.status ?? "active") === "active"
      ),
    [seller.listings]
  );
  const mapped = useMemo(() => active.filter(hasCoords), [active]);
  const unmappedCount = active.length - mapped.length;

  const center = mapped[0]
    ? { lat: mapped[0].lat, lng: mapped[0].lng }
    : DEFAULT_CENTER;
  const zoom = mapped[0] ? 9 : DEFAULT_ZOOM;

  return (
    <div className="app-root">
      <main className="app-main">
        <div className="dashboard-header">
          <div>
            <h2 className="section-title">Map View</h2>
            <p className="section-subtitle">Available material near you.</p>
          </div>
          <button className="ghost-button" onClick={() => navigate("/buyer/home")}>
            Back
          </button>
        </div>

        {!hasMapsKey() ? (
          <MapSetupFallback active={active} navigate={navigate} />
        ) : (
          <>
            <div
              style={{
                width: "100%",
                height: "68vh",
                borderRadius: 16,
                overflow: "hidden",
                border: "1px solid rgba(148,163,184,0.4)",
              }}
            >
              <Map
                defaultCenter={center}
                defaultZoom={zoom}
                gestureHandling="greedy"
                disableDefaultUI={false}
                clickableIcons={false}
              >
                {mapped.map((l) => (
                  <Marker
                    key={l.id}
                    position={{ lat: l.lat, lng: l.lng }}
                    title={`${l.material} — ${l.quantity} ${l.unit}`}
                    onClick={() => setSelected(l)}
                  />
                ))}

                {selected && hasCoords(selected) ? (
                  <InfoWindow
                    position={{ lat: selected.lat, lng: selected.lng }}
                    onCloseClick={() => setSelected(null)}
                  >
                    <div style={{ color: "#111827", maxWidth: 200 }}>
                      <div style={{ fontWeight: 700, marginBottom: 2 }}>
                        {selected.material} — {selected.quantity} {selected.unit}
                      </div>
                      <div style={{ fontSize: 12, marginBottom: 2 }}>
                        {selected.location}
                      </div>
                      {selected.price ? (
                        <div style={{ fontSize: 12, marginBottom: 6 }}>
                          Price: {selected.price}
                        </div>
                      ) : null}
                      <button
                        style={{
                          fontSize: 12,
                          padding: "4px 8px",
                          borderRadius: 6,
                          border: "none",
                          background: "#16a34a",
                          color: "white",
                          cursor: "pointer",
                        }}
                        onClick={() => navigate(`/buyer/details/${selected.id}`)}
                      >
                        View details
                      </button>
                    </div>
                  </InfoWindow>
                ) : null}
              </Map>
            </div>

            <p style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
              {mapped.length === 0
                ? "No mapped listings yet. New listings appear here once their location is recognized."
                : `Showing ${mapped.length} listing${mapped.length === 1 ? "" : "s"} on the map.`}
              {unmappedCount > 0
                ? ` (${unmappedCount} without map coordinates.)`
                : ""}
            </p>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function MapSetupFallback({ active, navigate }) {
  return (
    <>
      <GlassCard className="dashboard-card" style={{ marginBottom: 12 }}>
        <div className="card-title">Map needs a Google Maps key</div>
        <div className="card-description">
          Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to a <code>.env.local</code>{" "}
          file at the project root and restart the dev server to enable the live
          map. Until then, here are the active listings.
        </div>
      </GlassCard>

      {active.length === 0 ? (
        <GlassCard className="dashboard-card">
          <div className="card-description">No active listings yet.</div>
        </GlassCard>
      ) : (
        <div className="dashboard-grid">
          {active.map((l, idx) => (
            <GlassCard key={l?.id ?? `row_${idx}`} className="dashboard-card">
              <div className="card-title">
                {l.material} — {l.quantity} {l.unit}
              </div>
              <div className="card-description" style={{ marginTop: 6 }}>
                {l.location || "Location not set"}
              </div>
              <button
                className="primary-button"
                style={{ marginTop: 10 }}
                onClick={() => navigate(`/buyer/details/${l.id}`)}
              >
                View details
              </button>
            </GlassCard>
          ))}
        </div>
      )}
    </>
  );
}
