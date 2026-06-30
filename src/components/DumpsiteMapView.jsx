// src/components/DumpsiteMapView.jsx
//
// Map view for the Dump tab: every dump site with coordinates as a pin on an
// OpenStreetMap map (same free Leaflet stack as the Buy-side map). Featured
// (paid) sites get a distinct gold pin so they stand out. Tap a pin for details
// + directions.

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import BottomNav from "./BottomNav";
import { hasCoords, DEFAULT_CENTER, DEFAULT_ZOOM } from "../lib/maps";
import { api } from "../lib/api";

// Leaflet's default marker images don't resolve under bundlers — wire them up
// explicitly (safe to repeat even if another map screen already did it).
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// A gold "star" pin for featured (paid) sites.
const featuredIcon = L.divIcon({
  className: "",
  html:
    '<div style="font-size:26px;line-height:26px;filter:drop-shadow(0 1px 1px rgba(0,0,0,.4))">⭐</div>',
  iconSize: [26, 26],
  iconAnchor: [13, 26],
  popupAnchor: [0, -24],
});

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

export default function DumpsiteMapView() {
  const navigate = useNavigate();
  const [sites, setSites] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/dumpsites")
      .then((r) => !cancelled && setSites(Array.isArray(r) ? r : []))
      .catch(() => !cancelled && setSites([]));
    return () => {
      cancelled = true;
    };
  }, []);

  const all = sites || [];
  const mapped = useMemo(() => all.filter(hasCoords), [all]);
  const unmappedCount = all.length - mapped.length;

  const directions = (s) =>
    s.lat != null && s.lng != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.geoFormatted || s.location || "")}`;

  return (
    <div className="app-root">
      <main className="app-main">
        <div className="dashboard-header">
          <div>
            <h2 className="section-title">Dump sites map</h2>
            <p className="section-subtitle">Disposal sites near you. ⭐ = featured.</p>
          </div>
          <button className="ghost-button" onClick={() => navigate("/dump")}>
            List
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

            {mapped.map((s) => (
              <Marker
                key={s.id}
                position={[s.lat, s.lng]}
                icon={s.featured ? featuredIcon : new L.Icon.Default()}
              >
                <Popup>
                  <div style={{ minWidth: 170 }}>
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>
                      {s.featured ? "⭐ " : ""}
                      {s.name}
                    </div>
                    <div style={{ fontSize: 12, marginBottom: 2 }}>{s.type}</div>
                    {s.location ? (
                      <div style={{ fontSize: 12, marginBottom: 2 }}>{s.location}</div>
                    ) : null}
                    {s.accepts ? (
                      <div style={{ fontSize: 12, marginBottom: 6 }}>Accepts: {s.accepts}</div>
                    ) : null}
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        style={popupBtn("#16a34a")}
                        onClick={() => navigate(`/dump/${s.id}`)}
                      >
                        Details
                      </button>
                      <a
                        href={directions(s)}
                        target="_blank"
                        rel="noreferrer"
                        style={{ ...popupBtn("#2563eb"), textDecoration: "none", textAlign: "center" }}
                      >
                        Directions
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <p style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
          {sites === null
            ? "Loading…"
            : mapped.length === 0
            ? "No mapped sites yet. Add a site with a recognized address to see it here."
            : `Showing ${mapped.length} site${mapped.length === 1 ? "" : "s"} on the map.`}
          {unmappedCount > 0 ? ` (${unmappedCount} without map coordinates.)` : ""}
        </p>
      </main>

      <BottomNav />
    </div>
  );
}

const popupBtn = (bg) => ({
  fontSize: 12,
  padding: "4px 8px",
  borderRadius: 6,
  border: "none",
  background: bg,
  color: "white",
  cursor: "pointer",
});
