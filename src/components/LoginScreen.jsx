// src/components/LoginScreen.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const LoginScreen = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const setField = (key) => (e) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleContinue = async () => {
    setError("");
    setSubmitting(true);
    const result = await login(form);
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
      <h1 style={{ marginBottom: "16px" }}>Log In</h1>

      {error ? (
        <div className="form-error" style={{ marginBottom: 12 }}>
          {error}
        </div>
      ) : null}

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

      <div style={{ marginBottom: "20px" }}>
        <label style={labelStyle}>Password</label>
        <input
          type="password"
          placeholder="Your password"
          style={inputStyle}
          value={form.password}
          onChange={setField("password")}
          onKeyDown={(e) => e.key === "Enter" && handleContinue()}
        />
      </div>

      <button
        style={primaryButtonStyle}
        onClick={handleContinue}
        disabled={submitting}
      >
        Continue
      </button>

      <button style={secondaryButtonStyle} onClick={handleBack}>
        Back to Welcome
      </button>

      <p
        style={{
          marginTop: 16,
          fontSize: 13,
          opacity: 0.85,
          textAlign: "center",
        }}
      >
        No account yet?{" "}
        <span
          style={{
            color: "#93c5fd",
            cursor: "pointer",
            textDecoration: "underline",
          }}
          onClick={() => navigate("/signup")}
        >
          Sign up
        </span>
      </p>
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

export default LoginScreen;
