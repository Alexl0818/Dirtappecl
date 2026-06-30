// src/components/PrivacyPolicy.jsx
//
// Beta-stage privacy policy. Public page (linked from signup). This is a plain-
// language starting template for the beta — have it reviewed by a professional
// before a wide/public launch.

import React from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "./GlassCard";

const UPDATED = "June 30, 2026";

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  return (
    <div className="app-root">
      <main className="app-main" style={{ maxWidth: 720, margin: "0 auto", paddingBottom: 60 }}>
        <div className="dashboard-header">
          <div>
            <h2 className="section-title">Privacy Policy</h2>
            <p className="section-subtitle">SoilConnect (ECL Site Works LLC) · Updated {UPDATED}</p>
          </div>
        </div>

        <GlassCard className="dashboard-card">
          <div className="card-description" style={{ lineHeight: 1.6 }}>
            <p>
              SoilConnect is a marketplace that connects people who have soil/material with people who
              need it, and with haulers who move it. This policy explains what we collect and how we use it.
              SoilConnect is currently in <strong>beta</strong>.
            </p>

            <Section title="What we collect">
              <ul style={ulStyle}>
                <li><strong>Account info</strong> you provide: name, email, and optionally company, phone, and region.</li>
                <li><strong>Content you post</strong>: listings, material requests, haul bids, addresses/locations, messages, and ratings.</li>
                <li><strong>Basic technical data</strong> needed to run the service (e.g. login sessions).</li>
              </ul>
            </Section>

            <Section title="How we use it">
              <ul style={ulStyle}>
                <li>To operate the marketplace — show your listings/requests to relevant users and connect counterparties.</li>
                <li>To send <strong>service emails</strong>: email verification, password resets, and notifications about your requests, bids, and messages.</li>
                <li>To improve and secure the product.</li>
              </ul>
            </Section>

            <Section title="What others can see">
              <p>
                When you interact on the marketplace, the other party can see your name, company (if provided),
                your rating, and the details of the listing/request/bid involved. Your password is never shared
                or shown to anyone.
              </p>
            </Section>

            <Section title="Sharing">
              <p>
                We do <strong>not</strong> sell your personal information. We use a third-party email provider
                (Brevo) and hosting provider to deliver the service; address validation uses OpenStreetMap’s
                Nominatim. These providers process data only to operate SoilConnect.
              </p>
            </Section>

            <Section title="Security & retention">
              <p>
                Passwords are stored hashed (never in plain text). We keep your account data while your account
                is active. You can ask us to delete your account and associated data at any time by emailing us.
              </p>
            </Section>

            <Section title="Contact">
              <p>
                Questions or requests (including data deletion): <strong>alex@eclsite.com</strong>.
              </p>
            </Section>

            <p style={{ opacity: 0.7, fontSize: 12, marginTop: 16 }}>
              This is a beta-stage policy and may be updated as the product develops.
            </p>
          </div>
        </GlassCard>

        <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "center" }}>
          <button className="ghost-button" onClick={() => navigate(-1)}>Back</button>
          <button className="ghost-button" onClick={() => navigate("/terms")}>Terms of Service</button>
        </div>
      </main>
    </div>
  );
}

const ulStyle = { margin: "6px 0 0", paddingLeft: 18 };

const Section = ({ title, children }) => (
  <div style={{ marginTop: 16 }}>
    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{title}</h3>
    {children}
  </div>
);
