// src/components/ProfileScreen.jsx
import React from "react";
import GlassCard from "./GlassCard";

function ProfileScreen() {
  const user = {
    name: "Alex Leonard",
    company: "Mad House Customs LLC",
    role: "Site / Dirt Operator",
    email: "alex@example.com",
    phone: "(704) 555-0199",
    location: "Lake Norman, NC",
  };

  const preferences = [
    "Show listings within 50 miles by default",
    "Prefer screened topsoil and structural fill",
    "Notify me about new haul-off opportunities",
  ];

  return (
    <section className="seller-dashboard">
      <div className="dashboard-header">
        <div>
          <h2 className="section-title">Profile</h2>
          <p className="section-subtitle">
            Manage your account, company details, and notification preferences.
          </p>
        </div>
      </div>

      <div className="dashboard-grid">
        <GlassCard>
          <div className="card-header">
            <h3>Account</h3>
          </div>
          <p>
            <strong>Name:</strong> {user.name}
          </p>
          <p>
            <strong>Company:</strong> {user.company}
          </p>
          <p>
            <strong>Role:</strong> {user.role}
          </p>
          <p>
            <strong>Location:</strong> {user.location}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Phone:</strong> {user.phone}
          </p>
        </GlassCard>

        <GlassCard>
          <div className="card-header">
            <h3>Preferences</h3>
          </div>
          <ul className="notification-list">
            {preferences.map((p) => (
              <li key={p} className="notification-item">
                {p}
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </section>
  );
}

export default ProfileScreen;
