import React from "react";

function GlassCard({ className = "", children, ...rest }) {
  return (
    <div className={`dashboard-card ${className}`} {...rest}>
      {children}
    </div>
  );
}

export default GlassCard;
