import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import GlassCard from "./GlassCard";
import BottomNav from "./BottomNav";
import RouteMiniMap from "./RouteMiniMap";
import StarRating from "./StarRating";
import { hasCoords } from "../lib/maps";
import { api } from "../lib/api";
import { useInquiry } from "./InquiryContext";
import { useHaulBids } from "./HaulBidContext";
import { useSellerListings } from "./SellerListingContext";

function formatDate(iso) {
  if (!iso) return "Not set";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Not set";
  return d.toLocaleString();
}

// Human-readable order status from the request + its haul opportunity.
function orderStatus(request, opp) {
  if (request.status === "declined") {
    return { label: "Declined", tone: "draft", detail: "The seller declined this request." };
  }
  if (opp && opp.status === "completed") {
    return {
      label: "Delivered",
      tone: "active",
      detail: `Delivered${opp.awardedHaulerName ? ` by ${opp.awardedHaulerName}` : ""} — this order is complete.`,
    };
  }
  if (opp && opp.status === "awarded") {
    const parts = [
      opp.awardedHaulerName || "A hauler",
      opp.awardedAmount ? `$${opp.awardedAmount}` : null,
      opp.awardedAvailability || null,
    ].filter(Boolean);
    return {
      label: "Hauler assigned",
      tone: "active",
      detail: `${parts.join(" • ")} — your delivery is arranged.`,
    };
  }
  if (opp || request.status === "accepted") {
    return {
      label: "Arranging hauler",
      tone: "active",
      detail: "Accepted by the seller — haulers are bidding on the delivery.",
    };
  }
  return {
    label: "Awaiting seller",
    tone: "draft",
    detail: "Waiting for the seller to accept your request.",
  };
}

function Row({ label, value }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 12, opacity: 0.6 }}>{label}</div>
      <div style={{ fontSize: 14, marginTop: 2 }}>{value || "—"}</div>
    </div>
  );
}

export default function BuyerRequestDetails() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { removeRequest } = useInquiry();
  const { opportunities } = useHaulBids();
  const { listings } = useSellerListings();
  const request = state?.request;
  const opp =
    (Array.isArray(opportunities) ? opportunities : []).find(
      (o) => String(o.requestId) === String(request?.id)
    ) || null;
  const listing = (Array.isArray(listings) ? listings : []).find(
    (l) => String(l.id) === String(request?.listingId)
  );
  const sellerName = listing?.sellerCompany || listing?.sellerName || "the seller";
  const sellerEmail = listing?.sellerEmail;
  const haulerEmail = opp?.awardedHaulerEmail;
  const haulerName = opp?.awardedHaulerName || "the hauler";
  const completed = opp?.status === "completed";

  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSaved, setReviewSaved] = useState(false);

  const [hRating, setHRating] = useState(0);
  const [hComment, setHComment] = useState("");
  const [hSaved, setHSaved] = useState(false);

  // Load any reviews I've already left for this completed order.
  useEffect(() => {
    let active = true;
    if (completed && opp?.id) {
      api
        .get(`/reviews/mine?oppId=${encodeURIComponent(opp.id)}`)
        .then((revs) => {
          if (!active) return;
          const list = Array.isArray(revs) ? revs : [];
          const forSeller = list.find((r) => r.toEmail === sellerEmail);
          if (forSeller) {
            setRating(forSeller.rating);
            setReviewComment(forSeller.comment || "");
            setReviewSaved(true);
          }
          const forHauler = list.find((r) => r.toEmail === haulerEmail);
          if (forHauler) {
            setHRating(forHauler.rating);
            setHComment(forHauler.comment || "");
            setHSaved(true);
          }
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [completed, sellerEmail, haulerEmail, opp?.id]);

  const submitReview = async () => {
    if (!rating || !sellerEmail || !opp?.id) return;
    try {
      await api.post("/reviews", {
        toEmail: sellerEmail,
        rating,
        comment: reviewComment,
        oppId: opp.id,
      });
      setReviewSaved(true);
    } catch (e) {
      console.error("review failed", e.message);
    }
  };

  const submitHaulerReview = async () => {
    if (!hRating || !haulerEmail || !opp?.id) return;
    try {
      await api.post("/reviews", {
        toEmail: haulerEmail,
        rating: hRating,
        comment: hComment,
        oppId: opp.id,
      });
      setHSaved(true);
    } catch (e) {
      console.error("hauler review failed", e.message);
    }
  };

  const messageSeller = () =>
    navigate("/messages/thread", {
      state: {
        inquiry: {
          id: request.id,
          myRole: "buyer",
          otherName: sellerName,
          material: request.material,
          quantity: request.quantity,
          unit: request.unit,
          location: request.address,
        },
      },
    });

  const handleCancel = async () => {
    if (!request) return;
    if (!window.confirm("Cancel this request? This can't be undone.")) return;
    try {
      await removeRequest(request.id);
    } catch (e) {
      console.error("cancel request failed", e.message);
    }
    navigate("/buyer/requests");
  };

  if (!request) {
    return (
      <div className="app-root">
        <main className="app-main">
          <h2 className="section-title">Request details</h2>
          <GlassCard className="dashboard-card" style={{ marginTop: 12 }}>
            <div className="card-description" style={{ marginBottom: 12 }}>
              No request selected. Open a request from your list first.
            </div>
            <button
              className="primary-button full-width"
              onClick={() => navigate("/buyer/requests")}
            >
              Back to requests
            </button>
          </GlassCard>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="app-root">
      <main className="app-main">
        <div className="dashboard-header">
          <div>
            <h2 className="section-title">Request details</h2>
            <p className="section-subtitle">Your submitted material request.</p>
          </div>
          <span
            className={`status-pill ${
              request.status === "accepted" ? "status-active" : "status-draft"
            }`}
          >
            {request.status || "open"}
          </span>
        </div>

        <GlassCard className="dashboard-card">
          <Row
            label="Material"
            value={`${request.material || "Unknown"} — ${request.quantity ?? ""} ${
              request.unit || ""
            }`.trim()}
          />
          <Row label="Delivery address" value={request.address} />
          <Row label="Notes" value={request.notes} />
          <Row label="Submitted" value={formatDate(request.createdAt)} />
        </GlassCard>

        {(() => {
          const s = orderStatus(request, opp);
          return (
            <GlassCard className="dashboard-card" style={{ marginTop: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div style={{ fontSize: 12, opacity: 0.6 }}>Order status</div>
                <span
                  className={`status-pill ${
                    s.tone === "active" ? "status-active" : "status-draft"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              <div style={{ marginTop: 8, fontSize: 14 }}>{s.detail}</div>
            </GlassCard>
          );
        })()}

        {completed && sellerEmail ? (
          <GlassCard className="dashboard-card" style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 8 }}>
              Rate the seller
            </div>
            <StarRating value={rating} onChange={setRating} size={26} />
            <textarea
              className="field-input"
              style={{ marginTop: 10, width: "100%" }}
              rows={2}
              placeholder="Optional comment"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
            />
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
              <button
                className="primary-button"
                onClick={submitReview}
                disabled={!rating}
              >
                {reviewSaved ? "Update rating" : "Submit rating"}
              </button>
              {reviewSaved ? (
                <span style={{ color: "#4ade80", fontSize: 13 }}>
                  Thanks for rating!
                </span>
              ) : null}
            </div>
          </GlassCard>
        ) : null}

        {completed && haulerEmail ? (
          <GlassCard className="dashboard-card" style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 8 }}>
              Rate the hauler ({haulerName})
            </div>
            <StarRating value={hRating} onChange={setHRating} size={26} />
            <textarea
              className="field-input"
              style={{ marginTop: 10, width: "100%" }}
              rows={2}
              placeholder="Optional comment"
              value={hComment}
              onChange={(e) => setHComment(e.target.value)}
            />
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
              <button
                className="primary-button"
                onClick={submitHaulerReview}
                disabled={!hRating}
              >
                {hSaved ? "Update rating" : "Submit rating"}
              </button>
              {hSaved ? (
                <span style={{ color: "#4ade80", fontSize: 13 }}>
                  Thanks for rating!
                </span>
              ) : null}
            </div>
          </GlassCard>
        ) : null}

        {hasCoords(request) ? (
          <GlassCard className="dashboard-card" style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 8 }}>
              Delivery location
            </div>
            <RouteMiniMap
              pickup={{ lat: request.lat, lng: request.lng, label: request.address }}
              height={200}
            />
          </GlassCard>
        ) : null}

        <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            className="ghost-button"
            onClick={() => navigate("/buyer/requests")}
          >
            Back to requests
          </button>
          {request.listingId ? (
            <button className="btn btn-primary" onClick={messageSeller}>
              Message seller
            </button>
          ) : null}
          {request.status !== "accepted" ? (
            <button
              className="ghost-button"
              style={{ borderColor: "rgba(248,113,113,0.7)", color: "#fca5a5" }}
              onClick={handleCancel}
            >
              Cancel request
            </button>
          ) : null}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
