import React, { useEffect, useState } from "react";
import GlassCard from "./GlassCard";
import { api } from "../lib/api";

// Plan & billing panel for the Profile screen. Reflects the free period, current
// plan, monthly usage, and offers subscribe/cancel (subscribe is a stub until
// Stripe is wired — see server /api/billing/subscribe).
export default function BillingCard() {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    api
      .get("/billing/status")
      .then(setStatus)
      .catch(() => setStatus(null));

  useEffect(() => {
    load();
  }, []);

  const subscribe = async (plan) => {
    setBusy(true);
    try {
      await api.post("/billing/subscribe", { plan });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    setBusy(true);
    try {
      await api.post("/billing/cancel");
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (!status) return null;

  const sub = status.subscription || {};
  const active = sub.status === "active";

  return (
    <GlassCard className="dashboard-card" style={{ marginBottom: 12 }}>
      <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
        Plan &amp; billing
      </h2>

      {!status.billingActive ? (
        <div className="card-description">
          🎉 Free period — {status.userCount}/{status.threshold} users. Everything
          is free right now; no subscription needed.
        </div>
      ) : active ? (
        <div className="card-description">
          ✓ Active plan:{" "}
          <strong>{sub.plan === "hauler" ? "Hauler" : "Poster"}</strong>
          {sub.currentPeriodEnd
            ? ` · renews ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`
            : ""}
        </div>
      ) : (
        <div className="card-description">
          Choose a plan to keep posting / bidding.
        </div>
      )}

      <div style={{ marginTop: 8, fontSize: "0.8rem", opacity: 0.75 }}>
        Posts this month: {status.postsThisMonth} (first {status.freePostsPerMonth}{" "}
        free)
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
        {active ? (
          <button className="ghost-button" onClick={cancel} disabled={busy}>
            Cancel plan
          </button>
        ) : (
          <>
            <button
              className="primary-button"
              onClick={() => subscribe("enduser")}
              disabled={busy}
            >
              Poster — {status.prices.enduser}
            </button>
            <button
              className="ghost-button"
              onClick={() => subscribe("hauler")}
              disabled={busy}
            >
              Hauler — {status.prices.hauler}
            </button>
          </>
        )}
      </div>

      {active && sub.stub ? (
        <div style={{ marginTop: 10, fontSize: "0.72rem", opacity: 0.6 }}>
          (Demo subscription — real card billing via Stripe is wired in later.)
        </div>
      ) : null}
    </GlassCard>
  );
}
