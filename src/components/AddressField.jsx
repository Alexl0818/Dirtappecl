import React, { useState } from "react";
import { geocodeAddress } from "../lib/maps";

// Address input that confirms the address is real/geocodable. On blur (or the
// Check button) it geocodes, shows the matched address or a clear error, and
// reports the resolved { lat, lng, formatted } to the parent via onResolved
// (null when unresolved). Lets the parent block submission until it resolves.
export default function AddressField({
  value,
  onChange,
  onResolved,
  label = "Address",
  placeholder = "Street, city, state or ZIP",
}) {
  const [status, setStatus] = useState("idle"); // idle | checking | ok | fail
  const [formatted, setFormatted] = useState("");

  async function check() {
    const text = (value || "").trim();
    if (!text) {
      setStatus("idle");
      onResolved && onResolved(null);
      return;
    }
    setStatus("checking");
    const geo = await geocodeAddress(text);
    if (geo) {
      setStatus("ok");
      setFormatted(geo.formatted);
      onResolved && onResolved(geo);
    } else {
      setStatus("fail");
      setFormatted("");
      onResolved && onResolved(null);
    }
  }

  return (
    <div className="form-field">
      <div className="field-label">{label}</div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          className="field-input"
          style={{ flex: 1 }}
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            setStatus("idle");
            onResolved && onResolved(null); // editing invalidates a prior match
          }}
          onBlur={check}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              check();
            }
          }}
        />
        <button type="button" className="ghost-button" onClick={check}>
          Check
        </button>
      </div>

      {status === "checking" ? (
        <div style={{ marginTop: 6, fontSize: "0.78rem", opacity: 0.8 }}>
          Checking address…
        </div>
      ) : status === "ok" ? (
        <div style={{ marginTop: 6, fontSize: "0.78rem", color: "#4ade80" }}>
          ✓ {formatted}
        </div>
      ) : status === "fail" ? (
        <div className="field-error" style={{ marginTop: 6 }}>
          We couldn’t find that address. Add a city/state or ZIP and try again.
        </div>
      ) : null}
    </div>
  );
}
