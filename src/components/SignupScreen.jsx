import React from "react";

const SignupScreen = ({ onNext, onBack }) => {
  return (
    <div>
      <h2>Create Account</h2>
      <div style={fieldGroupStyle}>
        <label>Full Name</label>
        <input style={inputStyle} placeholder="Your name" />
      </div>
      <div style={fieldGroupStyle}>
        <label>Email</label>
        <input
          style={inputStyle}
          type="email"
          placeholder="you@example.com"
        />
      </div>
      <div style={fieldGroupStyle}>
        <label>Phone</label>
        <input
          style={inputStyle}
          type="tel"
          placeholder="(555) 123-4567"
        />
      </div>
      <div style={fieldGroupStyle}>
        <label>Password</label>
        <input
          style={inputStyle}
          type="password"
          placeholder="Create a password"
        />
      </div>
      <button style={buttonStyle} onClick={onNext}>
        Next: Choose How You’ll Use the App
      </button>
      <button style={secondaryButtonStyle} onClick={onBack}>
        Back to Login
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

export default SignupScreen;
