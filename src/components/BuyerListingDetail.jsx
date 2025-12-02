import React, { useState } from "react";

const BuyerListingDetail = ({ listing, onBack, onRequest }) => {
  const [note, setNote] = useState("");

  if (!listing) {
    return (
      <div>
        <p>Listing not found.</p>
        <button style={backButtonStyle} onClick={onBack}>
          Back to listings
        </button>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    onRequest(note);
    setNote("");
  };

  return (
    <div>
      <button style={backLinkStyle} onClick={onBack}>
        ← Back to listings
    </button>

      <header style={headerStyle}>
        <h2 style={titleStyle}>{listing.soilType}</h2>
        <p style={locationStyle}>
          <span style={emojiStyle}>📍</span>
          {listing.location}
        </p>
      </header>

      <section style={cardStyle}>
        <div style={rowStyle}>
          <div>
            <div style={labelStyle}>Quantity</div>
            <div style={valueStyle}>{listing.quantity}</div>
          </div>
          <div>
            <div style={labelStyle}>Price</div>
            <div style={valueStyle}>{listing.price}</div>
          </div>
        </div>

        <div style={dividerStyle} />

        <p style={helperTextStyle}>
          This is a summary of the material at this location. You can send a
          request to the seller with notes about timing, delivery, or questions.
        </p>
      </section>

      <section style={formSectionStyle}>
        <h3 style={formTitleStyle}>Request this load</h3>
        <form onSubmit={handleSubmit}>
          <label style={fieldLabelStyle}>
            Note to seller <span style={{ color: "#9ca3af" }}>(optional)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Example: Need 10 loads delivered to Lot 14, Tuesday between 8am–12pm."
            style={textareaStyle}
          />
          <button type="submit" style={primaryButtonStyle}>
            Send Request
          </button>
        </form>
      </section>
    </div>
  );
};

const backLinkStyle = {
  border: "none",
  background: "none",
  padding: 0,
  marginBottom: "8px",
  fontSize: "13px",
  cursor: "pointer",
  color: "#2563eb",
};

const headerStyle = {
  marginBottom: "12px",
};

const titleStyle = {
  margin: 0,
  fontSize: "22px",
};

const locationStyle = {
  margin: "4px 0 0 0",
  fontSize: "13px",
  color: "#6b7280",
  display: "flex",
  alignItems: "center",
  gap: "4px",
};

const emojiStyle = {
  fontSize: "14px",
};

const cardStyle = {
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  padding: "12px 14px",
  background:
    "linear-gradient(135deg, rgba(37,99,235,0.03), rgba(15,23,42,0.01))",
  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
  marginBottom: "16px",
};

const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
};

const labelStyle = {
  fontSize: "11px",
  color: "#9ca3af",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const valueStyle = {
  fontSize: "15px",
  fontWeight: 600,
  color: "#111827",
};

const dividerStyle = {
  height: "1px",
  backgroundColor: "#e5e7eb",
  margin: "10px 0",
};

const helperTextStyle = {
  margin: 0,
  fontSize: "13px",
  color: "#4b5563",
};

const formSectionStyle = {
  marginTop: "8px",
};

const formTitleStyle = {
  margin: "0 0 8px 0",
  fontSize: "16px",
};

const fieldLabelStyle = {
  display: "block",
  fontSize: "13px",
  marginBottom: "4px",
};

const textareaStyle = {
  width: "100%",
  minHeight: "90px",
  padding: "8px 10px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  marginBottom: "10px",
  resize: "vertical",
};

const primaryButtonStyle = {
  display: "inline-block",
  padding: "10px 16px",
  fontSize: "14px",
  borderRadius: "999px",
  border: "none",
  cursor: "pointer",
  backgroundColor: "#2563eb",
  color: "white",
  fontWeight: 500,
};

const backButtonStyle = {
  padding: "8px 16px",
  fontSize: "14px",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
  backgroundColor: "#e5e7eb",
  color: "#111827",
};

export default BuyerListingDetail;
