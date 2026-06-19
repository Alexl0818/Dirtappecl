// src/components/SignupScreen.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const SignupScreen = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    company: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const setField = (key) => (e) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleCreateAccount = () => {
    setError("");
    setSubmitting(true);
    const result = signup(form);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate("/mode");
  };

  const handleBack = () => navigate("/");

  return (
    <div style={{ padding: "16px", maxWidth: 480, margin: "0 auto" }}>
      <h1 style={{ marginBottom: "16px" }}>Sign Up</h1>

      {error ? (
        <div className="form-error" style={{ marginBottom: 12 }}>
          {error}
        </div>
      ) : null}

      <div style={{ marginBottom: "12px" }}>
        <label style={labelStyle}>Name</label>
        <input
          type="text"
          placeholder="Your name"
          style={inputStyle}
          value={form.name}
          onChange={setField("name")}
        />
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label style={labelStyle}>Email</label>
        <input
          type="email"
          placeholder="you@example.com"
          style={inputStyle}
          value={form.email}
          onChange={setField("email")}
          autoCapitalize="none"
        />
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label style={labelStyle}>Password</label>
        <input
          type="password"
          placeholder="At least 6 characters"
          style={inputStyle}
          value={form.password}
          onChange={setField("password")}
          onKeyDown={(e) => e.key === "Enter" && handleCreateAccount()}
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label style={labelStyle}>Company (optional)</label>
        <input
          type="text"
          placeholder="Company name"
          style={inputStyle}
          value={form.company}
          onChange={setField("company")}
        />
      </div>

      <button
        style={primaryButtonStyle}
        onClick={handleCreateAccount}
        disabled={submitting}
      >
        Create account
      </button>

      <button style={secondaryButtonStyle} onClick={handleBack}>
        Back to Welcome
      </button>
    </div>
  );
};

const labelStyle = { display: "block", marginBottom: "4px" };

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
