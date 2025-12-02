import React from "react";

const LoginScreen = ({ onContinue, onBack }) => {
  return (
    <div>
      <h2>Log In</h2>
      <div style={fieldGroupStyle}>
        <label>Email</label>
        <input
          style={inputStyle}
          type="email"
          placeholder="you@example.com"
        />
      </div>
      <div style={fieldGroupStyle}>
        <label>Password</label>
        <input
          style={inputStyle}
          type="password"
          placeholder="••••••••"
        />
      </div>
      <button style={buttonStyle} onClick={onContinue}>
        Continue
      </button>
      <button style={secondaryButtonStyle} onClick={onBack}>
        Back to Welcome
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

const secondaryButtonStyle = {
  ...buttonStyle,
  backgroundColor: "#e5e7eb",
  color: "#111827",
};

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: "6px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
};

const fieldGroupStyle = {
  marginBottom: "12px",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

export default LoginScreen;
