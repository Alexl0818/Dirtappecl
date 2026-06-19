// src/components/BuyerMapView.jsx

import React from "react";
import GlassCard from "./GlassCard";

const BuyerMapView = () => {
  return (
    <div
      style={{
        maxWidth: "480px",
        margin: "0 auto",
        padding: "16px 16px 80px",
      }}
    >
      <GlassCard className="dashboard-card" style={{ marginBottom: "16px" }}>
        <h2 style={{ fontSize: "15px", marginBottom: "4px" }}>
          Nothing to show yet
        </h2>
        <p style={{ fontSize: "12px", opacity: 0.7 }}>
          When sellers have active listings, a simple map-style overview will
          appear here.
        </p>
      </GlassCard>

      {/* Background map placeholder area */}
      <div
        style={{
          width: "100%",
          height: "70vh",
          borderRadius: "16px",
          background: "rgba(0,0,0,0.15)",
          backdropFilter: "blur(4px)",
        }}
      />
    </div>
  );
};

export default BuyerMapView;
