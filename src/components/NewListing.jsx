import React, { useState } from "react";
import GlassCard from "./GlassCard";

function NewListing({ onCancel, onCreate }) {
  const [material, setMaterial] = useState("");
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [bidOnly, setBidOnly] = useState(false);
  const [haulType, setHaulType] = useState("none");
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState([]);

  const handleCreate = () => {
    const listing = {
      material,
      quantity,
      location,
      price: bidOnly ? "Bid Only" : price,
      haulType,
      notes,
      images,
      createdAt: new Date().toISOString(),
    };

    onCreate(listing);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
  };

  return (
    <section className="seller-dashboard" style={{ paddingBottom: "80px" }}>
      <h2 className="section-title">Create New Listing</h2>
      <p className="section-subtitle">
        Enter material details to publish a new listing.
      </p>

      <GlassCard>
        {/* Material */}
        <label style={{ fontSize: "0.85rem" }}>Material Type</label>
        <select
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
          style={inputStyle}
        >
          <option value="">Select material…</option>
          <option value="Topsoil">Topsoil</option>
          <option value="Screened Topsoil">Screened Topsoil</option>
          <option value="Structural Fill">Structural Fill</option>
          <option value="Unsuitable">Unsuitable</option>
          <option value="Haul-Off">Haul-Off</option>
        </select>

        {/* Quantity */}
        <label style={{ fontSize: "0.85rem" }}>Quantity (CY)</label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="e.g., 4000"
          style={inputStyle}
        />

        {/* Location */}
        <label style={{ fontSize: "0.85rem" }}>Location</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Mooresville, NC"
          style={inputStyle}
        />

        {/* Price */}
        <label style={{ fontSize: "0.85rem" }}>Price (per CY)</label>
        <input
          type="number"
          value={price}
          disabled={bidOnly}
          onChange={(e) => setPrice(e.target.value)}
          placeholder={bidOnly ? "Bid Only" : "$10"}
          style={{ ...inputStyle, opacity: bidOnly ? 0.4 : 1 }}
        />

        <div style={{ margin: "8px 0" }}>
          <label style={{ fontSize: "0.85rem", display: "flex", gap: "6px" }}>
            <input
              type="checkbox"
              checked={bidOnly}
              onChange={() => setBidOnly(!bidOnly)}
            />
            Bid Only (no price)
          </label>
        </div>

        {/* Haul Type */}
        <label style={{ fontSize: "0.85rem" }}>Haul Type</label>
        <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
          {["none", "in", "off"].map((type) => (
            <button
              key={type}
              onClick={() => setHaulType(type)}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "8px",
                border:
                  haulType === type
                    ? "1px solid #22c55e"
                    : "1px solid rgba(255,255,255,0.1)",
                background:
                  haulType === type
                    ? "rgba(34, 197, 94, 0.2)"
                    : "rgba(255,255,255,0.03)",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              {type === "none" ? "No Haul" : type === "in" ? "Haul-In" : "Haul-Off"}
            </button>
          ))}
        </div>

        {/* Notes */}
        <label style={{ fontSize: "0.85rem" }}>Notes / Description</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Any important details…"
          style={{ ...inputStyle, resize: "none" }}
        />

        {/* Images */}
        <label style={{ fontSize: "0.85rem" }}>Upload Photos</label>
        <input type="file" multiple onChange={handleImageUpload} />

        {images.length > 0 && (
          <p style={{ fontSize: "0.8rem", marginTop: "4px" }}>
            {images.length} file(s) selected
          </p>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.3)",
              background: "transparent",
              color: "white",
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleCreate}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "999px",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              border: "none",
              color: "#020617",
              fontWeight: 600,
            }}
          >
            Create Listing
          </button>
        </div>
      </GlassCard>
    </section>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px",
  margin: "6px 0 12px 0",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.03)",
  color: "#fff",
};

export default NewListing;
