import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useHaulBid } from "./HaulBidContext.jsx";
import { distanceMiles } from "../lib/maps";

export default function HaulerHaulOpportunity() {
  const { oppId } = useParams();
  const navigate = useNavigate();

  const { opportunities, bids, setBids } = useHaulBid();

  const safeOpps = Array.isArray(opportunities) ? opportunities : [];
  const safeBids = Array.isArray(bids) ? bids : [];

  const opp = useMemo(() => {
    return safeOpps.find((o) => String(o.id) === String(oppId)) || null;
  }, [safeOpps, oppId]);

  const oppBids = useMemo(() => {
    if (!opp) return [];
    return safeBids
      .filter((b) => String(b.oppId) === String(opp.id))
      .slice()
      .sort((a, b) => Number(a.amount || 0) - Number(b.amount || 0));
  }, [safeBids, opp]);

  const isLocked = !!opp && opp.status === "awarded";
  const winnerBidId = opp?.awardedBidId;

  const [amount, setAmount] = useState("");
  const [availability, setAvailability] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!opp) return;
    if (isLocked) return;

    const cleanAmount = Number(amount);
    if (!Number.isFinite(cleanAmount) || cleanAmount <= 0) return;

    const newBid = {
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      oppId: opp.id,
      amount: cleanAmount,
      availability: availability || "",
      notes: notes || "",
      status: "pending",
      createdAt: Date.now(),
    };

    const next = [newBid, ...safeBids];
    if (typeof setBids === "function") setBids(next);

    setAmount("");
    setAvailability("");
    setNotes("");
  };

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h2 style={{ margin: 0 }}>Opportunity</h2>
          <div style={{ opacity: 0.85, fontSize: 13 }}>
            Status: <strong>{opp?.status || "open"}</strong>
          </div>
        </div>
      </div>

      {!opp ? (
        <div className="dashboard-card" style={{ marginTop: 12 }}>
          <div style={{ opacity: 0.85 }}>Opportunity not found.</div>
        </div>
      ) : (
        <>
          <div className="dashboard-card" style={{ marginTop: 12 }}>
            <h3 style={{ marginTop: 0 }}>Job Info</h3>
            <div style={{ opacity: 0.9, fontSize: 13 }}>
              <div>
                <strong>Material:</strong> {opp.material || "—"}
              </div>
              <div>
                <strong>Quantity:</strong> {opp.quantity || "—"} {opp.unit || ""}
              </div>
              <div>
                <strong>Pickup:</strong> {opp.pickup || opp.location || "—"}
              </div>
              <div>
                <strong>Dropoff:</strong> {opp.dropoff || opp.address || "—"}
              </div>
              {(() => {
                const dist = distanceMiles(
                  { lat: opp.pickupLat, lng: opp.pickupLng },
                  { lat: opp.dropoffLat, lng: opp.dropoffLng }
                );
                return dist != null ? (
                  <div style={{ marginTop: 4, color: "rgb(74,222,128)", fontWeight: 600 }}>
                    Haul distance: ~{Math.round(dist)} mi
                  </div>
                ) : null;
              })()}
            </div>

            {isLocked && (
              <div
                className="dashboard-card"
                style={{
                  marginTop: 10,
                  background: "rgba(34,197,94,0.10)",
                  border: "1px solid rgba(34,197,94,0.25)",
                }}
              >
                <div style={{ fontWeight: 800 }}>Awarded</div>
                <div style={{ opacity: 0.85, fontSize: 13, marginTop: 6 }}>
                  Bidding is locked.
                </div>
              </div>
            )}
          </div>

          <div className="dashboard-card" style={{ marginTop: 12 }}>
            <h3 style={{ marginTop: 0 }}>Submit Bid</h3>

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
              <input
                className="input"
                type="number"
                step="1"
                placeholder="Amount ($)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isLocked}
              />
              <input
                className="input"
                type="text"
                placeholder="Availability"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                disabled={isLocked}
              />
              <textarea
                className="input"
                placeholder="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                disabled={isLocked}
              />
              <button className="btn btn-primary" type="submit" disabled={isLocked}>
                {isLocked ? "Locked" : "Submit Bid"}
              </button>
            </form>
          </div>

          <div className="dashboard-card" style={{ marginTop: 12 }}>
            <h3 style={{ marginTop: 0 }}>Bids</h3>

            {!oppBids.length ? (
              <div style={{ opacity: 0.8 }}>No bids yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {oppBids.map((b) => {
                  const isWinner = isLocked && String(winnerBidId) === String(b.id);

                  return (
                    <div key={b.id} className="dashboard-card">
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div style={{ fontWeight: 800 }}>${b.amount}</div>
                        <div style={{ opacity: 0.85, fontSize: 13 }}>
                          {isWinner ? "Winner" : b.status || "pending"}
                        </div>
                      </div>

                      <div style={{ marginTop: 6, opacity: 0.9, fontSize: 13 }}>
                        <div>
                          <strong>Availability:</strong> {b.availability || "—"}
                        </div>
                        <div>
                          <strong>Notes:</strong> {b.notes || "—"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
