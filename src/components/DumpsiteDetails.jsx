// src/components/DumpsiteDetails.jsx
//
// One dump site: full details, a directions link, and controls. The owner can
// edit/delete their site; an admin can also feature it (the paid tier) or
// delete it as moderation.

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import GlassCard from "./GlassCard";
import BottomNav from "./BottomNav";
import { useAuth } from "./AuthContext";
import { api } from "../lib/api";

const DumpsiteDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  const [site, setSite] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const list = await api.get("/dumpsites");
      const s = (Array.isArray(list) ? list : []).find((x) => String(x.id) === String(id));
      if (!s) setError("This site no longer exists.");
      else setSite(s);
    } catch (e) {
      setError(e.message || "Couldn't load this site.");
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isOwner = site && user && site.ownerEmail === user.email;
  const isAdmin = !!user?.isAdmin;

  const directionsUrl = site
    ? site.lat != null && site.lng != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${site.lat},${site.lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(site.geoFormatted || site.location || "")}`
    : "#";

  async function toggleFeatured() {
    setBusy(true);
    try {
      const updated = await api.patch(`/dumpsites/${site.id}`, { featured: !site.featured });
      setSite(updated);
    } catch (e) {
      alert(e.message || "Couldn't update.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete "${site.name}"? This can't be undone.`)) return;
    setBusy(true);
    try {
      await api.del(`/dumpsites/${site.id}`);
      navigate("/dump");
    } catch (e) {
      alert(e.message || "Couldn't delete.");
      setBusy(false);
    }
  }

  if (error) {
    return (
      <div style={{ maxWidth: 560, margin: "0 auto", padding: 16 }}>
        <GlassCard className="dashboard-card">
          <div className="card-description" style={{ color: "#fca5a5" }}>{error}</div>
          <button className="primary-button full-width" onClick={() => navigate("/dump")}>
            Back to sites
          </button>
        </GlassCard>
        <BottomNav />
      </div>
    );
  }

  if (!site) {
    return (
      <div style={{ maxWidth: 560, margin: "0 auto", padding: 16 }}>
        <p style={{ opacity: 0.6 }}>Loading…</p>
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "16px 16px 90px" }}>
      <button className="ghost-button" onClick={() => navigate("/dump")} style={{ marginBottom: 12 }}>
        ← All sites
      </button>

      <GlassCard className="dashboard-card">
        <div style={{ fontSize: 20, fontWeight: 700 }}>
          {site.featured ? "⭐ " : ""}
          {site.name}
        </div>
        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>{site.type}</div>

        <Row label="Location" value={site.geoFormatted || site.location} />
        <Row label="Accepts" value={site.accepts} />
        <Row label="Phone" value={site.phone} />
        <Row label="Hours" value={site.hours} />
        <Row label="Fees" value={site.price} />
        <Row label="Notes" value={site.notes} />

        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="primary-button full-width"
          style={{ display: "block", textAlign: "center", textDecoration: "none", marginTop: 14 }}
        >
          Get directions
        </a>
      </GlassCard>

      {(isOwner || isAdmin) && (
        <GlassCard className="dashboard-card" style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            {isOwner ? "Manage this site" : "Admin"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(isOwner || isAdmin) && (
              <button className="ghost-button" onClick={() => navigate(`/dump/edit/${site.id}`)}>
                Edit
              </button>
            )}
            {isAdmin && (
              <button className="ghost-button" onClick={toggleFeatured} disabled={busy}>
                {site.featured ? "★ Remove featured" : "☆ Mark as featured (paid)"}
              </button>
            )}
            <button
              onClick={remove}
              disabled={busy}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid rgba(248,113,113,0.5)",
                background: "rgba(127,29,29,0.7)",
                color: "#fee2e2",
                fontSize: 13,
                fontWeight: 600,
                cursor: busy ? "default" : "pointer",
              }}
            >
              Delete site
            </button>
          </div>
        </GlassCard>
      )}

      <BottomNav />
    </div>
  );
};

const Row = ({ label, value }) =>
  value ? (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 11, opacity: 0.6, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{value}</div>
    </div>
  ) : null;

export default DumpsiteDetails;
