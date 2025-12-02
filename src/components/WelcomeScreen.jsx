import React from "react";

const WelcomeScreen = ({ onLogin, onSignup }) => (
  <div>
    <h1 style={{ textAlign: "center" }}>SoilConnect</h1>
    <p style={{ textAlign: "center", marginBottom: "32px" }}>
      Connecting soil buyers, sellers, and haulers.
    </p>
    <button style={buttonStyle} onClick={onLogin}>
      Log In
    </button>
    <button style={buttonStyle} onClick={onSignup}>
      Sign Up
    </button>
  </div>
);

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
