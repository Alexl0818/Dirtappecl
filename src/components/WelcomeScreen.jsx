// src/components/WelcomeScreen.jsx

import React from "react";
import { useNavigate } from "react-router-dom";

const WelcomeScreen = () => {
  const navigate = useNavigate();

  return (
    <div
      className="app-root"
      style={{ justifyContent: "center", padding: "24px" }}
    >
      <main
        className="app-main"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          minHeight: "70vh",
          gap: 8,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "2rem",
            fontWeight: 700,
            letterSpacing: "0.01em",
            textShadow: "0 2px 10px rgba(15,23,42,0.85)",
          }}
        >
          HaulYard
        </h1>
        <p
          style={{
            margin: "4px 0 28px",
            opacity: 0.9,
            textShadow: "0 1px 6px rgba(15,23,42,0.8)",
          }}
        >
          Connecting soil buyers, sellers, and haulers.
        </p>

        <button
          className="primary-button full-width"
          style={{ maxWidth: 320 }}
          onClick={() => navigate("/login")}
        >
          Log In
        </button>
        <button
          className="ghost-button"
          style={{ maxWidth: 320, width: "100%", padding: "12px 16px" }}
          onClick={() => navigate("/signup")}
        >
          Sign Up
        </button>
      </main>
    </div>
  );
};

export default WelcomeScreen;
