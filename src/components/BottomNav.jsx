// src/components/BottomNav.jsx

import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname || "/";

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
      />
      <NavItem
        label="Haul"
        tabId="haul"
        activeTab={activeTab}
        onChangeTab={handleChangeTab}
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

const NavItem = ({ label, tabId, activeTab, onChangeTab }) => {
  const isActive = activeTab === tabId;
  return (
    <button
      onClick={() => onChangeTab(tabId)}
      style={{
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
    </button>
  );
};

export default BottomNav;
