import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import GlassCard from "./GlassCard";
import BottomNav from "./BottomNav";
import { useSellerListings } from "./SellerListingContext";
import { geocodeAddress } from "../lib/maps";

export default function NewListing() {
  const navigate = useNavigate();
  const { listingId } = useParams();
  const seller = useSellerListings();

  const listings = Array.isArray(seller.listings) ? seller.listings : [];
  const existing = useMemo(() => {
    if (!listingId) return null;
    return listings.find((l) => String(l?.id) === String(listingId)) || null;
  }, [listingId, listings]);
  const isEdit = !!listingId;

  const [form, setForm] = useState({
    material: "Clean Fill",
    quantity: "",
    unit: "tons",
    location: "",
    price: "",
    notes: "",
  });

  const [error, setError] = useState("");

  // Prefill the form when editing an existing listing
  useEffect(() => {
    if (!existing) return;
    setForm({
      material: existing.material || "Clean Fill",
      quantity:
        existing.quantity != null ? String(existing.quantity) : "",
      unit: existing.unit || "tons",
      location: existing.location || "",
      price: existing.price != null ? String(existing.price) : "",
      notes: existing.notes || "",
    });
  }, [existing]);

  function setField(key, value) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  const [saving, setSaving] = useState(false);

  async function onPublish() {
    setError("");

    if (!form.material) return setError("Please select a material.");
    if (!form.quantity || Number.isNaN(Number(form.quantity)))
      return setError("Please enter a valid quantity.");
    if (!form.location.trim()) return setError("Please enter a location.");

    const fields = {
      material: form.material,
      quantity: Number(form.quantity),
      unit: form.unit,
      location: form.location.trim(),
      price: form.price.trim(),
      notes: form.notes.trim(),
    };

    setSaving(true);
    // Best-effort geocode so the listing shows on the map.
    const geo = await geocodeAddress(fields.location);
    if (geo) {
      fields.lat = geo.lat;
      fields.lng = geo.lng;
      fields.geoFormatted = geo.formatted;
    }

    try {
      if (isEdit) {
        await seller.updateListing(listingId, fields);
      } else {
        await seller.addListing(fields);
      }
      navigate("/seller/listing");
    } catch (e) {
      setError(e.message || "Could not save the listing. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-root">
      <main className="app-main">
        <div className="dashboard-header">
          <div>
            <h2 className="section-title">{isEdit ? "Edit Listing" : "New Listing"}</h2>
            <p className="section-subtitle">
              {isEdit
                ? "Update the details buyers see."
                : "Post available material for buyers."}
            </p>
          </div>

          <button className="ghost-button" onClick={() => navigate("/seller/dashboard")}>
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
              <div className="field-label">Material</div>
              <select
                className="field-input"
                value={form.material}
                onChange={(e) => setField("material", e.target.value)}
              >
                <option>Clean Fill</option>
                <option>Topsoil</option>
                <option>Clay</option>
                <option>Gravel</option>
                <option>Asphalt Millings</option>
                <option>Other</option>
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
              <div className="field-label">Location</div>
              <input
                className="field-input"
                value={form.location}
                onChange={(e) => setField("location", e.target.value)}
                placeholder="City / Jobsite / Zip"
              />
            </div>

            <div className="form-field">
              <div className="field-label">Price (optional)</div>
              <input
                className="field-input"
                value={form.price}
                onChange={(e) => setField("price", e.target.value)}
                placeholder="$ / ton or $ / load"
              />
            </div>

            <div className="form-field">
              <div className="field-label">Notes</div>
              <textarea
                className="field-input"
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Access details, hours, restrictions, etc."
                rows={4}
              />
            </div>

            <div className="profile-actions">
              <button
                className="primary-button full-width"
                onClick={onPublish}
                disabled={saving}
              >
                {saving
                  ? "Saving…"
                  : isEdit
                  ? "Save Changes"
                  : "Publish Listing"}
              </button>
            </div>
          </div>
        </GlassCard>
      </main>

      <BottomNav />
    </div>
  );
}
