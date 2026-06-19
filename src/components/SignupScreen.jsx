// src/components/SignupScreen.jsx

import React from "react";
import { useNavigate } from "react-router-dom";

const SignupScreen = () => {
  const navigate = useNavigate();

  const handleCreateAccount = () => {
    // after signup, send them to mode selection (or change to /buyer/home if you prefer)
    navigate("/mode");
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div style={{ padding: "16px" }}>
      <h1 style={{ marginBottom: "16px" }}>Sign Up</h1>

      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>Email</label>
        <input
          type="email"
          placeholder="you@example.com"
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>Password</label>
        <input type="password" placeholder="Create a password" style={inputStyle} />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>
          Company (optional)
        </label>
        <input type="text" placeholder="Company name" style={inputStyle} />
      </div>

      <button style={primaryButtonStyle} onClick={handleCreateAccount}>
        Create account
      </button>

      <button style={secondaryButtonStyle} onClick={handleBack}>
        Back to Welcome
      </button>
    </div>
  );
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
};

const primaryButtonStyle = {
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

const secondaryButtonStyle = {
  display: "block",
  width: "100%",
  padding: "10px 16px",
  fontSize: "14px",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
  backgroundColor: "#e5e7eb",
  color: "#111827",
};

export default SignupScreen;
