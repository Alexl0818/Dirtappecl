// src/components/RouteMiniMap.jsx
//
// Small read-only map showing pickup + dropoff with a connecting route line.
// Renders nothing if neither point has coordinates.

import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../lib/leafletSetup";

function hasXY(p) {
  return p && typeof p.lat === "number" && typeof p.lng === "number";
}

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 11);
      return;
    }
    map.fitBounds(
      L.latLngBounds(points.map((p) => [p.lat, p.lng])),
      { padding: [30, 30] }
    );
  }, [points, map]);
  return null;
}

export default function RouteMiniMap({ pickup, dropoff, height = 220 }) {
  const points = [pickup, dropoff].filter(hasXY);
  if (points.length === 0) return null;

  const center = points[0];

  return (
    <div
      style={{
        height,
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid rgba(148,163,184,0.4)",
      }}
    >
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={8}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />

        {points.map((p, i) => (
          <Marker key={i} position={[p.lat, p.lng]}>
            {p.label ? <Popup>{p.label}</Popup> : null}
          </Marker>
        ))}

        {points.length === 2 ? (
          <Polyline
            positions={points.map((p) => [p.lat, p.lng])}
            pathOptions={{ color: "#22c55e", weight: 3, opacity: 0.85 }}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}
