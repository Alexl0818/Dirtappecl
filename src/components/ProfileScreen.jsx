// src/components/ProfileScreen.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "./GlassCard";
import BottomNav from "./BottomNav";
import { useAuth } from "./AuthContext";

const ProfileScreen = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, ready, updateProfile, logout } = useAuth();

  const [form, setForm] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    region: "",
  });
  const [roles, setRoles] = useState({ buyer: true, seller: false, hauler: false });
  const [saved, setSaved] = useState(false);

  // Sync form when the signed-in user loads/changes.
  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || "",
      company: user.company || "",
      phone: user.phone || "",
      email: user.email || "",
      region: user.region || "",
    });
    if (user.roles) setRoles({ buyer: false, seller: false, hauler: false, ...user.roles });
  }, [user]);

  const setField = (key) => (e) => {
    setSaved(false);
    setForm((p) => ({ ...p, [key]: e.target.value }));
  };

  const toggleRole = (key) => {
    setSaved(false);
    setRoles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    updateProfile({
      name: form.name,
      company: form.company,
      phone: form.phone,
      region: form.region,
      roles,
    });
    setSaved(true);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Graceful state when nobody is signed in.
  if (ready && !isAuthenticated) {
    return (
      <div className="app-root">
        <main className="app-main">
          <h1 className="section-title">Profile</h1>
          <GlassCard className="dashboard-card" style={{ marginTop: 12 }}>
            <div className="card-title">You're not signed in</div>
            <div className="card-description">
              Log in or create an account to manage your profile.
            </div>
            <button className="primary-button full-width" onClick={() => navigate("/login")}>
              Go to Log In
            </button>
          </GlassCard>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div
      className="profile-screen"
      style={{ maxWidth: "480px", margin: "0 auto", padding: "16px 16px 90px" }}
    >
      <h1 style={{ marginBottom: "4px", fontSize: "22px", fontWeight: 600 }}>
        Profile
      </h1>
      <p style={{ marginBottom: "16px", opacity: 0.8, fontSize: "13px" }}>
        Manage your account details, contact info, and what roles you operate in.
      </p>

      {/* Account */}
      <GlassCard className="dashboard-card" style={{ marginBottom: "12px" }}>
        <h2 style={sectionTitle}>Account</h2>
        <Field label="Name" value={form.name} onChange={setField("name")} placeholder="Your name" />
        <Field
          label="Company (optional)"
          value={form.company}
          onChange={setField("company")}
          placeholder="Company name"
        />
        <Field label="Email" value={form.email} onChange={() => {}} placeholder="you@example.com" disabled />
      </GlassCard>

      {/* Contact & Region */}
      <GlassCard className="dashboard-card" style={{ marginBottom: "12px" }}>
        <h2 style={sectionTitle}>Contact &amp; Region</h2>
        <Field label="Phone" value={form.phone} onChange={setField("phone")} placeholder="(555) 555-5555" />
        <Field
          label="Region / Service Area"
          value={form.region}
          onChange={setField("region")}
          placeholder="e.g. Charlotte, NC"
        />
      </GlassCard>

      {/* Roles */}
      <GlassCard className="dashboard-card">
        <h2 style={sectionTitle}>Roles</h2>
        <p style={{ fontSize: "12px", opacity: 0.8, marginBottom: "10px" }}>
          Turn on whichever roles apply to you. You can change these anytime.
        </p>
        <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
          <RolePill label="Buyer" active={roles.buyer} onClick={() => toggleRole("buyer")} />
          <RolePill label="Seller" active={roles.seller} onClick={() => toggleRole("seller")} />
          <RolePill label="Hauler" active={roles.hauler} onClick={() => toggleRole("hauler")} />
        </div>
      </GlassCard>

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <button className="primary-button full-width" onClick={handleSave}>
          {saved ? "Saved ✓" : "Save changes"}
        </button>
        <button className="ghost-button" onClick={handleLogout}>
          Log out
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

const sectionTitle = { fontSize: "14px", fontWeight: 600, marginBottom: "8px" };

const Field = ({ label, value, onChange, placeholder, disabled }) => (
  <div style={{ marginBottom: "10px" }}>
    <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", opacity: 0.9 }}>
      {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: "8px",
        border: "1px solid rgba(148,163,184,0.8)",
        background: disabled ? "rgba(15,23,42,0.5)" : "rgba(15,23,42,0.9)",
        color: disabled ? "rgba(245,245,245,0.6)" : "white",
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
      border: active ? "1px solid rgba(74,222,128,0.9)" : "1px solid rgba(148,163,184,0.7)",
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
