// src/components/WelcomeScreen.jsx

import React from "react";
import { useNavigate } from "react-router-dom";

const WelcomeScreen = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/login");
  };

  const handleSignup = () => {
    navigate("/signup");
  };

  return (
    <div>
      <h1 style={{ textAlign: "center" }}>SoilConnect</h1>
      <p style={{ textAlign: "center", marginBottom: "32px" }}>
        Connecting soil buyers, sellers, and haulers.
      </p>
      <button style={buttonStyle} onClick={handleLogin}>
        Log In
      </button>
      <button style={buttonStyle} onClick={handleSignup}>
        Sign Up
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

export default WelcomeScreen;
