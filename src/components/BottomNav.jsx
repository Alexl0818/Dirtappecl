// src/components/BottomNav.jsx

import React, { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useInquiry } from "./InquiryContext";
import { useHaulBids } from "./HaulBidContext";
import { useSellerListings } from "./SellerListingContext";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname || "/";

  const { user } = useAuth();
  const { requests } = useInquiry();
  const { opportunities, bids } = useHaulBids();
  const { listings } = useSellerListings();

  // Actionable-item counts for the current user.
  const { sellBadge, haulBadge } = useMemo(() => {
    const email = user?.email;
    const myListingIds = new Set(
      (Array.isArray(listings) ? listings : [])
        .filter((l) => l.sellerEmail === email)
        .map((l) => String(l.id))
    );
    const sell = (Array.isArray(requests) ? requests : []).filter(
      (r) => r.status === "open" && myListingIds.has(String(r.listingId))
    ).length;

    const myBidOppIds = new Set(
      (Array.isArray(bids) ? bids : [])
        .filter((b) => b.haulerEmail === email)
        .map((b) => String(b.oppId))
    );
    const haul = (Array.isArray(opportunities) ? opportunities : []).filter(
      (o) => (o.status ?? "open") === "open" && !myBidOppIds.has(String(o.id))
    ).length;

    return { sellBadge: sell, haulBadge: haul };
  }, [user, requests, opportunities, bids, listings]);

  let activeTab = "buy";
  if (path.startsWith("/seller")) activeTab = "sell";
  else if (path.startsWith("/hauler")) activeTab = "haul";
  else if (path.startsWith("/messages")) activeTab = "msg";
  else if (path.startsWith("/profile")) activeTab = "profile";
  else if (path.startsWith("/buyer")) activeTab = "buy";

  const handleChangeTab = (tabId) => {
    switch (tabId) {
      case "buy":
        navigate("/buyer/home");
        break;
      case "sell":
        navigate("/seller/dashboard");
        break;
      case "haul":
        navigate("/hauler/dashboard");
        break;
      case "msg":
        navigate("/messages");
        break;
      case "profile":
        navigate("/profile");
        break;
      default:
        navigate("/");
    }
  };

  return (
    <nav
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        borderTop: "1px solid #e5e7eb",
        backgroundColor: "white",
        padding: "8px 12px",
        display: "flex",
        justifyContent: "space-around",
        maxWidth: "480px",
        margin: "0 auto",
        zIndex: 50,
      }}
    >
      <NavItem
        label="Buy"
        tabId="buy"
        activeTab={activeTab}
        onChangeTab={handleChangeTab}
      />
      <NavItem
        label="Sell"
        tabId="sell"
        activeTab={activeTab}
        onChangeTab={handleChangeTab}
        badge={sellBadge}
      />
      <NavItem
        label="Haul"
        tabId="haul"
        activeTab={activeTab}
        onChangeTab={handleChangeTab}
        badge={haulBadge}
      />
      <NavItem
        label="Inbox"
        tabId="msg"
        activeTab={activeTab}
        onChangeTab={handleChangeTab}
      />
      <NavItem
        label="Profile"
        tabId="profile"
        activeTab={activeTab}
        onChangeTab={handleChangeTab}
      />
    </nav>
  );
};

const NavItem = ({ label, tabId, activeTab, onChangeTab, badge = 0 }) => {
  const isActive = activeTab === tabId;
  return (
    <button
      onClick={() => onChangeTab(tabId)}
      style={{
        position: "relative",
        flex: 1,
        borderRadius: "999px",
        border: isActive ? "1px solid #2563eb" : "1px solid transparent",
        background: isActive ? "#f3f4ff" : "transparent",
        padding: "6px 4px",
        cursor: "pointer",
        fontSize: "13px",
        color: isActive ? "#2563eb" : "#6b7280",
        fontWeight: isActive ? 600 : 500,
      }}
    >
      {label}
      {badge > 0 ? (
        <span
          style={{
            position: "absolute",
            top: 0,
            right: "18%",
            minWidth: 16,
            height: 16,
            padding: "0 4px",
            borderRadius: 999,
            background: "#ef4444",
            color: "white",
            fontSize: 10,
            fontWeight: 700,
            lineHeight: "16px",
            textAlign: "center",
            boxSizing: "border-box",
          }}
        >
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </button>
  );
};

export default BottomNav;
