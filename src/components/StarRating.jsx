import React from "react";

// Reusable star rating. Read-only by default; pass onChange to make it an input.
export default function StarRating({
  value = 0,
  onChange,
  size = 18,
  readOnly = false,
}) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          onClick={readOnly ? undefined : () => onChange && onChange(s)}
          role={readOnly ? undefined : "button"}
          aria-label={readOnly ? undefined : `${s} star${s > 1 ? "s" : ""}`}
          style={{
            cursor: readOnly ? "default" : "pointer",
            color: s <= Math.round(value) ? "#facc15" : "rgba(226,232,240,0.3)",
            fontSize: size,
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          ★
        </span>
      ))}
    </span>
  );
}
