// src/components/ProfileScreen.jsx

import React, { useState } from "react";
import GlassCard from "./GlassCard";

const ProfileScreen = () => {
  const [roles, setRoles] = useState({
    buyer: true,
    seller: false,
    hauler: false,
  });

  const toggleRole = (key) => {
    setRoles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div
      className="profile-screen"
      style={{
        maxWidth: "480px",
        margin: "0 auto",
        padding: "16px 16px 80px",
      }}
    >
      {/* Header */}
      <h1
        style={{
          marginBottom: "4px",
          fontSize: "22px",
          fontWeight: 600,
        }}
      >
        Profile
      </h1>
      <p style={{ marginBottom: "16px", opacity: 0.8, fontSize: "13px" }}>
        Manage your account details, contact info, and what roles you operate in.
      </p>

      {/* Account */}
      <GlassCard className="dashboard-card" style={{ marginBottom: "12px" }}>
        <h2
          style={{
            fontSize: "14px",
            fontWeight: 600,
            marginBottom: "8px",
          }}
        >
          Account
        </h2>

        <Field label="Name" placeholder="Your name" />
        <Field label="Company (optional)" placeholder="Company name" />
      </GlassCard>

      {/* Contact & Region */}
      <GlassCard className="dashboard-card" style={{ marginBottom: "12px" }}>
        <h2
          style={{
            fontSize: "14px",
            fontWeight: 600,
            marginBottom: "8px",
          }}
        >
          Contact &amp; Region
        </h2>

        <Field label="Phone" placeholder="(555) 555-5555" />
        <Field label="Email" placeholder="you@example.com" />
        <Field label="Region / Service Area" placeholder="e.g. Charlotte, NC" />
      </GlassCard>

      {/* Roles – simplified copy */}
      <GlassCard className="dashboard-card">
        <h2
          style={{
            fontSize: "14px",
            fontWeight: 600,
            marginBottom: "8px",
          }}
        >
          Roles
        </h2>
        <p
          style={{
            fontSize: "12px",
            opacity: 0.8,
            marginBottom: "10px",
          }}
        >
          Turn on whichever roles apply to you. You can change these anytime.{" "}
          This doesn&apos;t lock you in – it just tells the app how you use it.
        </p>

        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "6px",
          }}
        >
          <RolePill
            label="Buyer"
            active={roles.buyer}
            onClick={() => toggleRole("buyer")}
          />
          <RolePill
            label="Seller"
            active={roles.seller}
            onClick={() => toggleRole("seller")}
          />
          <RolePill
            label="Hauler"
            active={roles.hauler}
            onClick={() => toggleRole("hauler")}
          />
        </div>

        <p style={{ fontSize: "11px", opacity: 0.7 }}>
          Future versions will use these roles to customize tabs, features, and
          notifications.
        </p>
      </GlassCard>
    </div>
  );
};

const Field = ({ label, placeholder }) => (
  <div style={{ marginBottom: "10px" }}>
    <label
      style={{
        display: "block",
        marginBottom: "4px",
        fontSize: "12px",
        opacity: 0.9,
      }}
    >
      {label}
    </label>
    <input
      type="text"
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: "8px",
        border: "1px solid rgba(148,163,184,0.8)",
        background: "rgba(15,23,42,0.9)",
        color: "white",
        fontSize: "13px",
      }}
    />
  </div>
);

const RolePill = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      flex: 1,
      padding: "8px 10px",
      borderRadius: "999px",
      border: active
        ? "1px solid rgba(74,222,128,0.9)"
        : "1px solid rgba(148,163,184,0.7)",
      background: active
        ? "radial-gradient(circle at top, #16a34a, #15803d)"
        : "rgba(15,23,42,0.8)",
      color: active ? "white" : "#e5e7eb",
      fontSize: "12px",
      fontWeight: active ? 600 : 500,
      cursor: "pointer",
    }}
  >
    {label}
  </button>
);

export default ProfileScreen;
