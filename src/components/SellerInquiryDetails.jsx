import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { useInquiry } from "./InquiryContext.jsx";
import { useSellerListings } from "./SellerListingContext.jsx";
import { useHaulBid } from "./HaulBidContext.jsx";

export default function SellerInquiryDetails() {
  const { listingId } = useParams();
  const navigate = useNavigate();

  const { inquiries, updateRequest } = useInquiry();
  const { listings } = useSellerListings();

  const { opportunities, bids, addOpportunity, awardBid } = useHaulBid();

  const safeInquiries = Array.isArray(inquiries) ? inquiries : [];
  const safeListings = Array.isArray(listings) ? listings : [];
  const safeOpps = Array.isArray(opportunities) ? opportunities : [];
  const safeBids = Array.isArray(bids) ? bids : [];

  const listing = useMemo(() => {
    return safeListings.find((l) => String(l.id) === String(listingId)) || null;
  }, [safeListings, listingId]);

  const listingRequests = useMemo(() => {
    return safeInquiries
      .filter((r) => String(r.listingId) === String(listingId))
      .slice()
      .reverse();
  }, [safeInquiries, listingId]);

  const acceptedRequest = useMemo(() => {
    return listingRequests.find((r) => r.status === "accepted") || null;
  }, [listingRequests]);

  const oppForAcceptedRequest = useMemo(() => {
    // Only surface a haul opportunity once a request on this listing is accepted.
    if (!acceptedRequest) return null;

    const byReq =
      safeOpps.find(
        (o) =>
          String(o.requestId) === String(acceptedRequest.id) ||
          String(o.inquiryId) === String(acceptedRequest.id)
      ) || null;

    if (byReq) return byReq;

    // Fallback: an opportunity tied to this listing (one accepted request/listing).
    return safeOpps.find((o) => String(o.listingId) === String(listingId)) || null;
  }, [safeOpps, acceptedRequest, listingId]);

  const bidsForOpp = useMemo(() => {
    if (!oppForAcceptedRequest) return [];
    return safeBids
      .filter((b) => String(b.oppId) === String(oppForAcceptedRequest.id))
      .slice()
      .sort((a, b) => Number(a.amount || 0) - Number(b.amount || 0));
  }, [safeBids, oppForAcceptedRequest]);

  const isLocked =
    !!oppForAcceptedRequest &&
    (oppForAcceptedRequest.status === "awarded" ||
      oppForAcceptedRequest.status === "completed");

  const awardedBid = useMemo(() => {
    if (!oppForAcceptedRequest?.awardedBidId) return null;
    return (
      safeBids.find((b) => String(b.id) === String(oppForAcceptedRequest.awardedBidId)) ||
      null
    );
  }, [safeBids, oppForAcceptedRequest]);

  const handleAccept = async (request) => {
    // One accepted request (and one haul opportunity) per listing.
    if (acceptedRequest) return;

    const alreadyHasOpp = safeOpps.some(
      (o) =>
        String(o.listingId) === String(listingId) ||
        String(o.requestId) === String(request.id)
    );

    await updateRequest(request.id, { status: "accepted" });
    if (alreadyHasOpp) return;

    // Shape covers every consumer: HaulerDashboard (pickupLocation/dropoffAddress),
    // HaulerHaulOpportunity (pickup/dropoff), and this screen (listingId/requestId).
    // The server assigns id/createdAt/status/sellerEmail.
    await addOpportunity({
      listingId: listingId,
      requestId: request.id,
      inquiryId: request.id,
      material: request.material || listing?.material || "",
      quantity: request.quantity,
      unit: request.unit,
      pickup: listing?.location || "",
      pickupLocation: listing?.location || "",
      dropoff: request.address || "",
      dropoffAddress: request.address || "",
      pickupLat: listing?.lat,
      pickupLng: listing?.lng,
      dropoffLat: request.lat,
      dropoffLng: request.lng,
      notes: request.notes || "",
    });
  };

  const handleAward = (bidId) => {
    if (!oppForAcceptedRequest || isLocked) return;
    awardBid(oppForAcceptedRequest.id, bidId);
  };

  const handleDecline = (request) => {
    updateRequest(request.id, { status: "declined" });
  };

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h2 style={{ margin: 0 }}>Listing Inquiries</h2>
          <div style={{ opacity: 0.85, fontSize: 13 }}>
            Listing: <strong>{listing?.material || "Unknown"}</strong>
            {listing?.location ? ` • ${listing.location}` : ""}
          </div>
        </div>
      </div>

      <div className="dashboard-card" style={{ marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Buyer Requests</h3>

        {!listingRequests.length ? (
          <div style={{ opacity: 0.8 }}>No requests yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {listingRequests.map((r) => (
              <div key={r.id} className="dashboard-card">
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ fontWeight: 700 }}>
                    {r.quantity} {r.unit} • {r.material}
                  </div>
                  <div style={{ opacity: 0.85, fontSize: 13 }}>
                    Status: <strong>{r.status || "pending"}</strong>
                  </div>
                </div>

                <div style={{ marginTop: 6, opacity: 0.9, fontSize: 13 }}>
                  <div>
                    <strong>From:</strong>{" "}
                    {r.buyerName || r.buyerEmail || "Buyer"}
                    {r.buyerCompany ? ` (${r.buyerCompany})` : ""}
                  </div>
                  <div>
                    <strong>Address:</strong> {r.address || "—"}
                  </div>
                  <div>
                    <strong>Notes:</strong> {r.notes || "—"}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  {r.status === "accepted" ? (
                    <span style={{ fontWeight: 700, color: "#4ade80" }}>
                      ✓ Accepted — haul opportunity created
                    </span>
                  ) : r.status === "declined" ? (
                    <span style={{ opacity: 0.7, fontSize: 13 }}>Declined</span>
                  ) : acceptedRequest ? (
                    <span style={{ opacity: 0.7, fontSize: 13 }}>
                      Another request on this listing was accepted.
                    </span>
                  ) : (
                    <>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleAccept(r)}
                      >
                        Accept request
                      </button>
                      <button className="btn" onClick={() => handleDecline(r)}>
                        Decline
                      </button>
                    </>
                  )}

                  <button
                    className="btn"
                    onClick={() =>
                      navigate("/messages/thread", {
                        state: {
                          inquiry: {
                            ...r,
                            myRole: "seller",
                            otherName: r.buyerName || "Buyer",
                            location: r.address,
                          },
                        },
                      })
                    }
                  >
                    Message buyer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dashboard-card" style={{ marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Hauling</h3>

        {!oppForAcceptedRequest ? (
          <div style={{ opacity: 0.8 }}>
            No haul opportunity yet. (Created when you accept a buyer request.)
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 700 }}>
                Opportunity #{String(oppForAcceptedRequest.id).slice(-6)}
              </div>
              <div style={{ opacity: 0.85, fontSize: 13 }}>
                Status: <strong>{oppForAcceptedRequest.status || "open"}</strong>
              </div>
            </div>

            {isLocked && (
              <div className="dashboard-card" style={{ marginTop: 10 }}>
                <div style={{ fontWeight: 800 }}>Awarded</div>
                <div style={{ marginTop: 6, opacity: 0.9, fontSize: 13 }}>
                  {awardedBid ? (
                    <>
                      <div>
                        <strong>Amount:</strong> ${awardedBid.amount}
                      </div>
                      <div>
                        <strong>Availability:</strong> {awardedBid.availability || "—"}
                      </div>
                      <div>
                        <strong>Notes:</strong> {awardedBid.notes || "—"}
                      </div>
                    </>
                  ) : (
                    <div style={{ opacity: 0.85 }}>Awarded bid not found.</div>
                  )}
                </div>
              </div>
            )}

            <div style={{ marginTop: 10 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Bids (lowest first)</div>

              {!bidsForOpp.length ? (
                <div style={{ opacity: 0.8 }}>No bids submitted yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {bidsForOpp.map((b) => {
                    const isWinner =
                      isLocked &&
                      String(oppForAcceptedRequest.awardedBidId) === String(b.id);

                    return (
                      <div key={b.id} className="dashboard-card">
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 10,
                            alignItems: "center",
                          }}
                        >
                          <div style={{ fontWeight: 800 }}>
                            ${b.amount}{" "}
                            <span style={{ opacity: 0.75, fontWeight: 600 }}>
                              • {b.availability || "availability —"}
                            </span>
                          </div>

                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <div style={{ opacity: 0.85, fontSize: 13 }}>
                              Status: <strong>{b.status || "pending"}</strong>
                            </div>

                            {!isLocked ? (
                              <button className="btn btn-primary" onClick={() => handleAward(b.id)}>
                                Award
                              </button>
                            ) : (
                              <span style={{ opacity: 0.8, fontSize: 13 }}>
                                {isWinner ? "Winner" : "Locked"}
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ marginTop: 6, opacity: 0.9, fontSize: 13 }}>
                          <div>
                            <strong>Hauler:</strong>{" "}
                            {b.haulerName || b.haulerEmail || "Hauler"}
                            {b.haulerCompany ? ` (${b.haulerCompany})` : ""}
                            {b.haulerRatingCount > 0 ? (
                              <span style={{ marginLeft: 6, color: "#facc15" }}>
                                ★ {b.haulerRating} ({b.haulerRatingCount})
                              </span>
                            ) : (
                              <span style={{ marginLeft: 6, opacity: 0.5, fontSize: 12 }}>
                                no ratings yet
                              </span>
                            )}
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
    </div>
  );
}
