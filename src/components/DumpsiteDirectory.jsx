// src/components/DumpsiteDirectory.jsx
//
// The "Dump" tab: a browsable directory of disposal/dump sites (LCID, C&D
// landfills, inert-debris yards, recycling, clean-fill-accepted lots). Anyone
// signed in can add a site for free; admin-featured sites (the paid tier) sort
// to the top with a badge. Simple text search across name/type/accepts/location.

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "./GlassCard";
import BottomNav from "./BottomNav";
import { api } from "../lib/api";

const DumpsiteDirectory = () => {
  const navigate = useNavigate();
  const [sites, setSites] = useState(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .get("/dumpsites")
      .then((r) => !cancelled && setSites(Array.isArray(r) ? r : []))
      .catch((e) => !cancelled && setError(e.message || "Couldn't load sites."));
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!sites) return [];
    const term = q.trim().toLowerCase();
    if (!term) return sites;
    return sites.filter((s) =>
      [s.name, s.type, s.accepts, s.location, s.geoFormatted]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [sites, q]);

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "16px 16px 90px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <h1 style={{ marginBottom: 4, fontSize: 22, fontWeight: 600 }}>Dump sites</h1>
        <button
          className="primary-button"
          onClick={() => navigate("/dump/new")}
          style={{ padding: "8px 14px", fontSize: 13 }}
        >
          + Add a site
        </button>
      </div>
      <p style={{ marginBottom: 14, opacity: 0.8, fontSize: 13 }}>
        Find a place to take dirt, fill, concrete, or debris near you.
      </p>

      <input
        placeholder="Search by name, type, material, or area…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid rgba(148,163,184,0.6)",
          background: "rgba(15,23,42,0.9)",
          color: "white",
          fontSize: 14,
          marginBottom: 14,
        }}
      />

      {error ? (
        <GlassCard className="dashboard-card">
          <div className="card-description" style={{ color: "#fca5a5" }}>{error}</div>
        </GlassCard>
      ) : null}

      {sites === null && !error ? (
        <p style={{ opacity: 0.6, fontSize: 13 }}>Loading…</p>
      ) : null}

      {sites && filtered.length === 0 ? (
        <GlassCard className="dashboard-card">
          <div className="card-title">{q ? "No matches" : "No sites yet"}</div>
          <div className="card-description">
            {q
              ? "Try a different search."
              : "Be the first to add a dump site so others know where to take material."}
          </div>
          {!q ? (
            <button className="primary-button full-width" onClick={() => navigate("/dump/new")}>
              Add the first site
            </button>
          ) : null}
        </GlassCard>
      ) : null}

      {filtered.map((s) => (
        <GlassCard
          key={s.id}
          className="dashboard-card"
          style={{ marginBottom: 10, cursor: "pointer" }}
          onClick={() => navigate(`/dump/${s.id}`)}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>
                {s.featured ? <span title="Featured">⭐ </span> : null}
                {s.name}
              </div>
              <div style={{ fontSize: 12, opacity: 0.85, marginTop: 3 }}>
                {s.type}
                {s.location ? ` · ${s.location}` : ""}
              </div>
              {s.accepts ? (
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 3 }}>Accepts: {s.accepts}</div>
              ) : null}
            </div>
            {s.featured ? (
              <span
                style={{
                  flexShrink: 0,
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#064e3b",
                  background: "#86efac",
                  borderRadius: 10,
                  padding: "2px 8px",
                }}
              >
                FEATURED
              </span>
            ) : null}
          </div>
        </GlassCard>
      ))}

      <BottomNav />
    </div>
  );
};

export default DumpsiteDirectory;
