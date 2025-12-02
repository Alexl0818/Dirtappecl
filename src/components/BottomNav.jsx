import React from "react";

const BottomNav = ({ activeTab, onChangeTab }) => {
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
      }}
    >
      <NavItem
        label="Buy"
        tabId="buy"
        activeTab={activeTab}
        onChangeTab={onChangeTab}
      />
      <NavItem
        label="Sell"
        tabId="sell"
        activeTab={activeTab}
        onChangeTab={onChangeTab}
      />
      <NavItem
        label="Haul"
        tabId="haul"
        activeTab={activeTab}
        onChangeTab={onChangeTab}
      />
      <NavItem
        label="AI"
        tabId="ai"
        activeTab={activeTab}
        onChangeTab={onChangeTab}
      />
      <NavItem
        label="Profile"
        tabId="profile"
        activeTab={activeTab}
        onChangeTab={onChangeTab}
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
        border: "none",
        background: "none",
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
