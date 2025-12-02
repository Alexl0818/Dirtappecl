import React from "react";
import GlassCard from "./GlassCard";

function SellerDashboard() {
  const kpis = [
    { label: "Active Listings", value: 12, trend: "+2 this week" },
    { label: "Open Inquiries", value: 5, trend: "3 awaiting reply" },
    { label: "Pending Orders", value: 3, trend: "ETA: 2–5 days" },
    { label: "Total Revenue (30d)", value: "$18,450", trend: "+12% vs last 30d" },
  ];

  const listings = [
    {
      id: "LOT-104",
      title: "4,000 CY – Topsoil (Screened)",
      location: "Mooresville, NC",
      price: "$14 / CY",
      status: "Active",
    },
    {
      id: "LOT-087",
      title: "8,500 CY – Structural Fill",
      location: "Statesville, NC",
      price: "$9 / CY",
      status: "Active",
    },
    {
      id: "LOT-079",
      title: "3,200 CY – Unsuitable / Haul-Off",
      location: "Charlotte, NC",
      price: "Bid Only",
      status: "Draft",
    },
  ];

  const activity = [
    {
      time: "Today • 9:42 AM",
      text: "New inquiry on LOT-104 from Turner Site Services.",
    },
    {
      time: "Yesterday • 3:15 PM",
      text: "You updated pricing on LOT-087.",
    },
    {
      time: "2 days ago • 11:03 AM",
      text: "Order #DA-22019 marked as fulfilled.",
    },
  ];

  const notifications = [
    "3 inquiries have been open for more than 24 hours.",
    "LOT-079 is still in Draft — complete details to publish.",
    "Add payout details to receive funds faster.",
  ];

  return (
    <section className="seller-dashboard">
      <div className="dashboard-header">
        <div>
          <h2 className="section-title">Seller Dashboard</h2>
          <p className="section-subtitle">
            Overview of your dirt listings, inquiries, and recent activity.
          </p>
        </div>
        <button className="primary-button">+ New Listing</button>
      </div>

      {/* KPI Row */}
      <div className="dashboard-grid kpi-grid">
        {kpis.map((item) => (
          <GlassCard key={item.label} className="kpi-card">
            <div className="kpi-label">{item.label}</div>
            <div className="kpi-value">{item.value}</div>
            <div className="kpi-trend">{item.trend}</div>
          </GlassCard>
        ))}
      </div>

      {/* Middle layout: Listings + Activity */}
      <div className="dashboard-grid main-grid">
        {/* Active Listings */}
        <GlassCard className="listings-card">
          <div className="card-header">
            <h3>Active Listings</h3>
            

          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Material</th>
                  <th>Location</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((lot) => (
                  <tr key={lot.id}>
                    <td>{lot.id}</td>
                    <td>{lot.title}</td>
                    <td>{lot.location}</td>
                    <td>{lot.price}</td>
                    <td>
                      <span
                        className={`status-pill status-${lot.status.toLowerCase()}`}
                      >
                        {lot.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Activity + Notifications */}
        <GlassCard className="side-column">
          <div className="card-header">
            <h3>Recent Activity</h3>
          </div>
          <ul className="activity-list">
            {activity.map((item, idx) => (
              <li key={idx} className="activity-item">
                <div className="activity-dot" />
                <div>
                  <div className="activity-text">{item.text}</div>
                  <div className="activity-time">{item.time}</div>
                </div>
              </li>
            ))}
          </ul>

          <div className="card-divider" />

          <div className="card-header">
            <h3>Notifications</h3>
          </div>
          <ul className="notification-list">
            {notifications.map((note, idx) => (
              <li key={idx} className="notification-item">
                {note}
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </section>
  );
}

export default SellerDashboard;
