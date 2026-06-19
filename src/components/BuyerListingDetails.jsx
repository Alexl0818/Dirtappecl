import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import GlassCard from "./GlassCard";
import BottomNav from "./BottomNav";
import { useSellerListings } from "./SellerListingContext";
import RouteMiniMap from "./RouteMiniMap";
import { hasCoords } from "../lib/maps";
import "./BuyerListingDetails.css";

function formatDate(iso) {
  if (!iso) return "Not set";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Not set";
  return d.toLocaleDateString();
}

function BuyerListingDetails() {
  const navigate = useNavigate();
  const { listingId } = useParams();
  const seller = useSellerListings();

  const listings = Array.isArray(seller.listings) ? seller.listings : [];
  const listing =
    listings.find((l) => String(l?.id) === String(listingId)) || null;

  const onBack = () => navigate("/buyer/browse");

  if (!listing) {
    return (
      <div className="buyer-details-screen">
        <div className="buyer-details-inner">
          <p className="buyer-details-error">Listing not found.</p>
          <button
            type="button"
            className="buyer-details-back-btn"
            onClick={onBack}
          >
            Back to results
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="buyer-details-screen">
      <div className="buyer-details-inner">
        <header className="buyer-details-header">
          <button
            type="button"
            className="buyer-details-back-link"
            onClick={onBack}
          >
            ← Back
          </button>
          <div>
            <h1 className="buyer-details-title">Material details</h1>
            <p className="buyer-details-subtitle">
              Review what&apos;s available before requesting haul or pickup.
            </p>
          </div>
        </header>

        <GlassCard className="buyer-details-card">
          <p className="buyer-details-label">Listing ID</p>
          <p className="buyer-details-value">{listing.id}</p>

          <p className="buyer-details-label">Material</p>
          <p className="buyer-details-value">
            {listing.material || "Not set"}
          </p>

          <p className="buyer-details-label">Seller</p>
          <p className="buyer-details-value">
            {listing.sellerCompany || listing.sellerName || "—"}
          </p>

          <div className="buyer-details-grid">
            <div>
              <p className="buyer-details-label">Quantity</p>
              <p className="buyer-details-value">
                {listing.quantity?.toLocaleString() || 0}{" "}
                {listing.unit || "units"}
              </p>
            </div>
            <div>
              <p className="buyer-details-label">Price</p>
              <p className="buyer-details-value">
                {listing.price
                  ? `$${listing.price} / ${(listing.unit || "").toLowerCase() || "unit"}`
                  : "Price TBD"}
              </p>
            </div>
          </div>

          <div className="buyer-details-grid">
            <div>
              <p className="buyer-details-label">Location</p>
              <p className="buyer-details-value">
                {listing.location || "Not set"}
              </p>
            </div>
            <div>
              <p className="buyer-details-label">Haul Included</p>
              <p className="buyer-details-value">
                {listing.haulIncluded
                  ? "Yes – haul included"
                  : "No – material only"}
              </p>
            </div>
          </div>

          <div className="buyer-details-notes-block">
            <p className="buyer-details-label">Site / access notes</p>
            <p className="buyer-details-notes">
              {listing.notes || "No notes added yet."}
            </p>
          </div>

          <p className="buyer-details-meta">
            Listed: {formatDate(listing.createdAt)}
          </p>
        </GlassCard>

        {hasCoords(listing) ? (
          <GlassCard className="buyer-details-card">
            <p className="buyer-details-label">Location</p>
            <RouteMiniMap
              pickup={{
                lat: listing.lat,
                lng: listing.lng,
                label: listing.location,
              }}
              height={200}
            />
          </GlassCard>
        ) : null}

        <GlassCard className="buyer-details-card buyer-details-actions-card">
          <div className="buyer-details-actions">
            <button
              type="button"
              className="buyer-details-primary-btn"
              onClick={() => navigate(`/buyer/request/${listing.id}`)}
            >
              Request material
            </button>
            <button
              type="button"
              className="buyer-details-secondary-btn"
              onClick={onBack}
            >
              Back to results
            </button>
          </div>
          <p className="buyer-details-footnote">
            Requesting opens a prefilled form. Your request will appear for the
            seller on the Sell tab.
          </p>
        </GlassCard>
      </div>

      <BottomNav />
    </div>
  );
}

export default BuyerListingDetails;
