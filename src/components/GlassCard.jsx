import React from "react";

/**
 * GlassCard
 * ----------
 * Single source of truth for all frosted cards in the app.
 *
 * Usage:
 *  <GlassCard>...</GlassCard>
 *  <GlassCard className="profile-card">...</GlassCard>
 */
function GlassCard({ className = "", children, ...rest }) {
  return (
    <div className={`glass-card dashboard-card ${className}`} {...rest}>
      {children}
    </div>
  );
}

export default GlassCard;
