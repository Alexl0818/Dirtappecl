import React from "react";
import { useNavigate } from "react-router-dom";

export default function ModeSelectScreen() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#222",
        color: "white",
        padding: "20px",
      }}
    >
      <h1>Mode Select</h1>
      <p>Select a role to continue.</p>

      <div style={{ display: "grid", gap: 12, maxWidth: 420 }}>
        <button onClick={() => navigate("/buyer/home")}>Buyer</button>
        <button onClick={() => navigate("/seller/dashboard")}>Seller</button>
        <button onClick={() => navigate("/hauler/dashboard")}>Hauler</button>
        <button onClick={() => navigate("/")}>Back</button>
      </div>
    </div>
  );
}
