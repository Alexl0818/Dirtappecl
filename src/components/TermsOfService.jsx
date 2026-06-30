// src/components/TermsOfService.jsx
//
// Beta-stage terms of service. Public page (linked from signup). Plain-language
// starting template for the beta — have it reviewed by a professional before a
// wide/public launch.

import React from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "./GlassCard";

const UPDATED = "June 30, 2026";

export default function TermsOfService() {
  const navigate = useNavigate();
  return (
    <div className="app-root">
      <main className="app-main" style={{ maxWidth: 720, margin: "0 auto", paddingBottom: 60 }}>
        <div className="dashboard-header">
          <div>
            <h2 className="section-title">Terms of Service</h2>
            <p className="section-subtitle">HaulYard (ECL Site Works LLC) · Updated {UPDATED}</p>
          </div>
        </div>

        <GlassCard className="dashboard-card">
          <div className="card-description" style={{ lineHeight: 1.6 }}>
            <p>
              By creating an account or using HaulYard, you agree to these terms. HaulYard is
              currently in <strong>beta</strong> and provided “as is” while we build and refine it.
            </p>

            <Section title="What HaulYard does (and doesn’t) do">
              <p>
                HaulYard is a <strong>connection platform</strong>. We help buyers, sellers, and haulers
                find each other and communicate. We are <strong>not</strong> a party to any deal, and we do{" "}
                <strong>not</strong> process payments for soil or hauling transactions — pricing, payment,
                scheduling, delivery, and the actual material are arranged directly between users. You are
                responsible for verifying the other party and the material before doing business.
              </p>
            </Section>

            <Section title="Your account">
              <ul style={ulStyle}>
                <li>Provide accurate information and keep your password secure.</li>
                <li>You’re responsible for activity on your account.</li>
                <li>One person per account; don’t impersonate others.</li>
              </ul>
            </Section>

            <Section title="Acceptable use">
              <ul style={ulStyle}>
                <li>Post only legitimate listings, requests, and bids.</li>
                <li>No spam, fraud, harassment, or unlawful activity.</li>
                <li>Don’t scrape, overload, or attempt to break the service.</li>
              </ul>
            </Section>

            <Section title="Subscriptions (future)">
              <p>
                HaulYard is free during the beta. In the future, posting beyond a monthly allowance
                (and hauler bidding) may require a paid subscription. We’ll make any pricing clear before it
                applies to you. HaulYard never takes a cut of your transactions.
              </p>
            </Section>

            <Section title="Disclaimer & liability">
              <p>
                The service is provided “as is,” without warranties. To the fullest extent permitted by law,
                ECL Site Works LLC is not liable for disputes between users, the quality or legality of any
                material, or any losses arising from deals made through the platform.
              </p>
            </Section>

            <Section title="Changes & contact">
              <p>
                We may update these terms as the product evolves. Questions: <strong>alex@eclsite.com</strong>.
              </p>
            </Section>

            <p style={{ opacity: 0.7, fontSize: 12, marginTop: 16 }}>
              This is a beta-stage agreement and may be updated as the product develops.
            </p>
          </div>
        </GlassCard>

        <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "center" }}>
          <button className="ghost-button" onClick={() => navigate(-1)}>Back</button>
          <button className="ghost-button" onClick={() => navigate("/privacy")}>Privacy Policy</button>
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
