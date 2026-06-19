// src/components/BuyerMapView.jsx

import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import GlassCard from "./GlassCard";
import BottomNav from "./BottomNav";
import { useSellerListings } from "./SellerListingContext";
import { hasCoords, DEFAULT_CENTER, DEFAULT_ZOOM } from "../lib/maps";

// Leaflet's default marker images don't resolve under bundlers — wire them up
// explicitly so markers render.
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Pans/zooms the map to fit the current markers whenever they change.
function FitToMarkers({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 11);
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [points, map]);
  return null;
}

export default function BuyerMapView() {
  const navigate = useNavigate();
  const seller = useSellerListings();

  const active = useMemo(
    () =>
      (Array.isArray(seller.listings) ? seller.listings : []).filter(
        (l) => (l?.status ?? "active") === "active"
      ),
    [seller.listings]
  );
  const mapped = useMemo(() => active.filter(hasCoords), [active]);
  const unmappedCount = active.length - mapped.length;

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

        <div
          style={{
            width: "100%",
            height: "68vh",
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid rgba(148,163,184,0.4)",
          }}
        >
          <MapContainer
            center={[DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]}
            zoom={DEFAULT_ZOOM}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitToMarkers points={mapped} />

            {mapped.map((l) => (
              <Marker key={l.id} position={[l.lat, l.lng]}>
                <Popup>
                  <div style={{ minWidth: 160 }}>
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>
                      {l.material} — {l.quantity} {l.unit}
                    </div>
                    <div style={{ fontSize: 12, marginBottom: 2 }}>
                      {l.location}
                    </div>
                    {l.price ? (
                      <div style={{ fontSize: 12, marginBottom: 6 }}>
                        Price: {l.price}
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
                      onClick={() => navigate(`/buyer/details/${l.id}`)}
                    >
                      View details
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <p style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
          {mapped.length === 0
            ? "No mapped listings yet. New listings appear here once their location is recognized."
            : `Showing ${mapped.length} listing${mapped.length === 1 ? "" : "s"} on the map.`}
          {unmappedCount > 0
            ? ` (${unmappedCount} without map coordinates.)`
            : ""}
        </p>

        {active.length === 0 ? (
          <GlassCard className="dashboard-card" style={{ marginTop: 12 }}>
            <div className="card-description">
              No active listings yet. Once sellers post material, it shows up
              here on the map.
            </div>
          </GlassCard>
        ) : null}
      </main>

      <BottomNav />
    </div>
  );
}
