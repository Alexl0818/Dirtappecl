import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import GlassCard from "./GlassCard";
import BottomNav from "./BottomNav";

import { useInquiry } from "./InquiryContext";
import { useSellerListings } from "./SellerListingContext";
import { geocodeAddress } from "../lib/maps";

export default function BuyerRequest() {
  const navigate = useNavigate();
  const { listingId } = useParams();

  const inquiry = useInquiry();
  const seller = useSellerListings();

  const listings = Array.isArray(seller.listings) ? seller.listings : [];
  const matchedListing = useMemo(() => {
    if (!listingId) return null;
    return listings.find((l) => String(l?.id) === String(listingId)) || null;
  }, [listingId, listings]);

  const materialOptions = useMemo(
    () => ["Clean Fill", "Topsoil", "Clay", "Gravel", "Asphalt Millings", "Other"],
    []
  );

  const [form, setForm] = useState({
    material: "Clean Fill",
    quantity: "",
    unit: "tons",
    address: "",
    notes: "",
  });

  const [error, setError] = useState("");

  // Prefill when coming from a listing
  useEffect(() => {
    if (!matchedListing) return;

    setForm((prev) => ({
      ...prev,
      material: matchedListing.material || prev.material,
      quantity:
        typeof matchedListing.quantity === "number" || typeof matchedListing.quantity === "string"
          ? String(matchedListing.quantity)
          : prev.quantity,
      unit: matchedListing.unit || prev.unit,
      notes: matchedListing.notes ? String(matchedListing.notes) : prev.notes,
    }));
  }, [matchedListing]);

  function setField(key, value) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  const [saving, setSaving] = useState(false);

  async function onContinue() {
    setError("");

    if (!form.material) return setError("Please select a material.");
    if (!form.quantity || Number.isNaN(Number(form.quantity)))
      return setError("Please enter a valid quantity.");
    if (!form.address.trim()) return setError("Please enter a delivery address.");

    const request = {
      id: `req_${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: "open",
      material: form.material,
      quantity: Number(form.quantity),
      unit: form.unit,
      address: form.address.trim(),
      notes: form.notes.trim(),

      // ✅ link to seller listing when applicable
      listingId: listingId || null,
    };

    // Best-effort geocode so the request location can show on the map.
    setSaving(true);
    const geo = await geocodeAddress(request.address);
    setSaving(false);
    if (geo) {
      request.lat = geo.lat;
      request.lng = geo.lng;
      request.geoFormatted = geo.formatted;
    }

    inquiry.addRequest(request);
    navigate("/buyer/requests");
  }

  return (
    <div className="app-root">
      <main className="app-main">
        <div className="dashboard-header">
          <div>
            <h2 className="section-title">
              {matchedListing ? "Request This Listing" : "Buyer Request"}
            </h2>
            <p className="section-subtitle">
              {matchedListing
                ? `Prefilled from: ${matchedListing.material || "Listing"}`
                : "Create a request for material."}
            </p>
          </div>

          <button className="ghost-button" onClick={() => navigate("/buyer/home")}>
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

            {matchedListing ? (
              <div style={{ marginBottom: 4, opacity: 0.9, fontSize: "0.85rem" }}>
                <span style={{ opacity: 0.8 }}>From listing:</span>{" "}
                <strong>
                  {matchedListing.material} — {matchedListing.quantity} {matchedListing.unit}
                </strong>{" "}
                {matchedListing.location ? <span>({matchedListing.location})</span> : null}
              </div>
            ) : null}

            <div className="form-field">
              <div className="field-label">Material</div>
              <select
                className="field-input"
                value={form.material}
                onChange={(e) => setField("material", e.target.value)}
              >
                {materialOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <div className="field-label">Quantity</div>
              <input
                className="field-input"
                value={form.quantity}
                onChange={(e) => setField("quantity", e.target.value)}
                placeholder="e.g. 200"
                inputMode="numeric"
              />
            </div>

            <div className="form-field">
              <div className="field-label">Unit</div>
              <select
                className="field-input"
                value={form.unit}
                onChange={(e) => setField("unit", e.target.value)}
              >
                <option value="tons">tons</option>
                <option value="yards">yards</option>
              </select>
            </div>

            <div className="form-field">
              <div className="field-label">Delivery Address</div>
              <input
                className="field-input"
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
                placeholder="Jobsite address"
              />
            </div>

            <div className="form-field">
              <div className="field-label">Notes</div>
              <textarea
                className="field-input"
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Optional details (access, hours, material specs, etc.)"
                rows={4}
              />
            </div>

            <div className="profile-actions">
              <button
                className="primary-button full-width"
                onClick={onContinue}
                disabled={saving}
              >
                {saving ? "Saving…" : "Continue"}
              </button>
            </div>
          </div>
        </GlassCard>
      </main>

      <BottomNav />
    </div>
  );
}
