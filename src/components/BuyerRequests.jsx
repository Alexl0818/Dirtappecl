import React from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "./GlassCard";
import BottomNav from "./BottomNav";
import { useInquiry } from "./InquiryContext";

export default function BuyerRequests() {
  const navigate = useNavigate();
  const inquiry = useInquiry();

  const requests = Array.isArray(inquiry.requests) ? inquiry.requests : [];

  return (
    <div className="app-root">
      <main className="app-main">
        <div className="dashboard-header">
          <div>
            <h2 className="section-title">Your Requests</h2>
            <p className="section-subtitle">
              {requests.length} submitted material request
              {requests.length === 1 ? "" : "s"}.
            </p>
          </div>
          <button className="primary-button" onClick={() => navigate("/buyer/request")}>
            New Request
          </button>
        </div>

        {requests.length === 0 ? (
          <GlassCard className="dashboard-card">
            <div className="card-title">No requests yet</div>
            <div className="card-description" style={{ marginBottom: 12 }}>
              Post what material you need and sellers can respond.
            </div>
            <button
              className="primary-button full-width"
              onClick={() => navigate("/buyer/request")}
            >
              Create your first request
            </button>
          </GlassCard>
        ) : (
          <div className="dashboard-grid">
            {requests.map((r, idx) => {
              const id = r?.id ?? `row_${idx}`;
              const material = r?.material ?? "Unknown";
              const qty = r?.quantity ?? "";
              const unit = r?.unit ?? "";
              const address = r?.address ?? "";
              const status = r?.status ?? "open";
              const createdAt = r?.createdAt
                ? new Date(r.createdAt).toLocaleString()
                : "";

              return (
                <GlassCard key={id} className="dashboard-card">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div className="card-title">
                      {material} — {qty} {unit}
                    </div>
                    <span
                      className={`status-pill ${
                        status === "accepted" ? "status-active" : "status-draft"
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  {address ? (
                    <div className="card-description" style={{ marginTop: 8 }}>
                      {address}
                    </div>
                  ) : null}
                  {createdAt ? (
                    <div style={{ marginTop: 6, fontSize: "0.78rem", opacity: 0.65 }}>
                      {createdAt}
                    </div>
                  ) : null}

                  <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                    <button
                      className="primary-button"
                      onClick={() =>
                        navigate("/buyer/request-details", { state: { request: r } })
                      }
                    >
                      View Details
                    </button>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}

        {requests.length > 0 ? (
          <div style={{ marginTop: 18 }}>
            <button
              className="ghost-button"
              onClick={() => {
                if (window.confirm("Clear all your requests?")) inquiry.clearRequests();
              }}
            >
              Clear All Requests
            </button>
          </div>
        ) : null}
      </main>

      <BottomNav />
    </div>
  );
}
