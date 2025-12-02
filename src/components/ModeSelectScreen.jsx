import React from "react";

const ModeSelectScreen = ({
  onSelectBuyer,
  onSelectSeller,
  onSelectHauler,
}) => {
  return (
    <div>
      <h2>What do you want to do today?</h2>
      <p style={{ marginBottom: "16px" }}>
        You can buy, sell, or haul soil. You’re not locked into just one.
      </p>
      <button style={buttonStyle} onClick={onSelectBuyer}>
        Buy Soil
      </button>
      <button style={buttonStyle} onClick={onSelectSeller}>
        Sell Soil
      </button>
      <button style={buttonStyle} onClick={onSelectHauler}>
        Haul Soil (Hauler / Vendor)
      </button>
    </div>
  );
};

const buttonStyle = {
  display: "block",
  width: "100%",
  padding: "12px 16px",
  marginBottom: "12px",
  fontSize: "16px",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
  backgroundColor: "#2563eb",
  color: "white",
};

export default ModeSelectScreen;
