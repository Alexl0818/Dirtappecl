// src/components/NewDumpsite.jsx
//
// Add or edit a dump site. Reuses AddressField so the location is geocoded for
// the map/directions. Posting is free for any signed-in user.

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import GlassCard from "./GlassCard";
import BottomNav from "./BottomNav";
import AddressField from "./AddressField";
import { geocodeAddress } from "../lib/maps";
import { api } from "../lib/api";

const TYPES = [
  "LCID (Land Clearing & Inert Debris)",
  "C&D Landfill",
  "Inert Debris / Fill",
  "Clean Fill Accepted",
  "Recycling Center",
  "Other",
];

export default function NewDumpsite() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: "",
    type: TYPES[0],
    accepts: "",
    location: "",
    phone: "",
    hours: "",
    price: "",
    notes: "",
  });
  const [geo, setGeo] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  // Load the existing site when editing.
  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    api
      .get("/dumpsites")
      .then((list) => {
        if (cancelled) return;
        const s = (Array.isArray(list) ? list : []).find((x) => String(x.id) === String(id));
        if (s)
          setForm({
            name: s.name || "",
            type: s.type || TYPES[0],
            accepts: s.accepts || "",
            location: s.location || "",
            phone: s.phone || "",
            hours: s.hours || "",
            price: s.price || "",
            notes: s.notes || "",
          });
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const setField = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  async function onSave() {
    setError("");
    if (!form.name.trim()) return setError("Please enter the site name.");
    if (!form.location.trim()) return setError("Please enter a location.");

    setSaving(true);
    let resolved = geo;
    if (!resolved) resolved = await geocodeAddress(form.location);
    if (!resolved) {
      setSaving(false);
      return setError("We couldn't find that location on the map. Try a fuller address or ZIP.");
    }

    const body = {
      name: form.name.trim(),
      type: form.type,
      accepts: form.accepts.trim(),
      location: form.location.trim(),
      phone: form.phone.trim(),
      hours: form.hours.trim(),
      price: form.price.trim(),
      notes: form.notes.trim(),
      lat: resolved.lat,
      lng: resolved.lng,
      geoFormatted: resolved.formatted,
    };

    try {
      const saved = isEdit
        ? await api.patch(`/dumpsites/${id}`, body)
        : await api.post("/dumpsites", body);
      navigate(`/dump/${saved.id}`);
    } catch (e) {
      setError(e.message || "Could not save the site. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="app-root">
        <main className="app-main">
          <p style={{ opacity: 0.6 }}>Loading…</p>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="app-root">
      <main className="app-main">
        <div className="dashboard-header">
          <div>
            <h2 className="section-title">{isEdit ? "Edit dump site" : "Add a dump site"}</h2>
            <p className="section-subtitle">Help others find a place to take material.</p>
          </div>
          <button className="ghost-button" onClick={() => navigate("/dump")}>
            Back
          </button>
        </div>

        <GlassCard className="dashboard-card">
          <div className="form-grid">
            {error ? (
              <div
                style={{
                  background: "rgba(160, 20, 20, 0.25)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  padding: 10,
                  borderRadius: 12,
                }}
              >
                {error}
              </div>
            ) : null}

            <div className="form-field">
              <div className="field-label">Site name</div>
              <input
                className="field-input"
                value={form.name}
                onChange={setField("name")}
                placeholder="e.g. ACME LCID Landfill"
              />
            </div>

            <div className="form-field">
              <div className="field-label">Type</div>
              <select className="field-input" value={form.type} onChange={setField("type")}>
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <div className="field-label">What they accept</div>
              <input
                className="field-input"
                value={form.accepts}
                onChange={setField("accepts")}
                placeholder="e.g. dirt, concrete, asphalt, brush, clean fill"
              />
            </div>

            <AddressField
              label="Location"
              placeholder="Street, city, state or ZIP"
              value={form.location}
              onChange={(v) => setForm((p) => ({ ...p, location: v }))}
              onResolved={setGeo}
            />

            <div className="form-field">
              <div className="field-label">Phone (optional)</div>
              <input
                className="field-input"
                value={form.phone}
                onChange={setField("phone")}
                placeholder="(555) 555-5555"
              />
            </div>

            <div className="form-field">
              <div className="field-label">Hours (optional)</div>
              <input
                className="field-input"
                value={form.hours}
                onChange={setField("hours")}
                placeholder="e.g. Mon–Fri 7am–4pm"
              />
            </div>

            <div className="form-field">
              <div className="field-label">Fees (optional)</div>
              <input
                className="field-input"
                value={form.price}
                onChange={setField("price")}
                placeholder="$ / ton or $ / load"
              />
            </div>

            <div className="form-field">
              <div className="field-label">Notes (optional)</div>
              <textarea
                className="field-input"
                value={form.notes}
                onChange={setField("notes")}
                placeholder="Access details, restrictions, what they DON'T take, etc."
                rows={4}
              />
            </div>

            <div className="profile-actions">
              <button className="primary-button full-width" onClick={onSave} disabled={saving}>
                {saving ? "Saving…" : isEdit ? "Save changes" : "Add site"}
              </button>
            </div>
          </div>
        </GlassCard>
      </main>
      <BottomNav />
    </div>
  );
}
