import React from "react";
import GlassCard from "./GlassCard";

function BuyerHome() {
  const kpis = [
    { label: "Matches Near You", value: 18, trend: "within 25 miles" },
    { label: "Open Requests", value: 4, trend: "waiting on quotes" },
    { label: "Saved Listings", value: 9, trend: "updated daily" },
  ];

  const listings = [
    {
      id: "BUY-211",
      title: "3,000 CY – Topsoil (Unscreened)",
      location: "Huntersville, NC",
      price: "$11 / CY",
    },
    {
      id: "BUY-204",
      title: "5,500 CY – Structural Fill",
      location: "Concord, NC",
      price: "$8 / CY",
    },
    {
      id: "BUY-189",
      title: "2,000 CY – Screened Topsoil",
      location: "Mooresville, NC",
      price: "$15 / CY",
    },
  ];

  const quickFilters = [
    "Topsoil",
    "Structural Fill",
    "Screened",
    "Haul Included",
    "Within 25 mi",
  ];

  return (
    <section className="seller-dashboard">
      <div className="dashboard-header">
        <div>
          <h2 className="section-title">Find Dirt</h2>
          <p className="section-subtitle">
            Browse nearby material listings and send inquiries in a few taps.
          </p>
        </div>
      </div>

      <div className="dashboard-grid kpi-grid">
        {kpis.map((item) => (
          <GlassCard key={item.label} className="kpi-card">
            <div className="kpi-label">{item.label}</div>
            <div className="kpi-value">{item.value}</div>
            <div className="kpi-trend">{item.trend}</div>
          </GlassCard>
        ))}
      </div>

      <div className="dashboard-grid main-grid">
        <GlassCard>
          <div className="card-header">
            <h3>Featured Listings Near You</h3>
            <button className="ghost-button">View all</button>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Material</th>
                  <th>Location</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((lot) => (
                  <tr key={lot.id}>
                    <td>{lot.id}</td>
                    <td>{lot.title}</td>
                    <td>{lot.location}</td>
                    <td>{lot.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard className="side-column">
          <div className="card-header">
            <h3>Quick Filters</h3>
          </div>
          <ul className="notification-list">
            {quickFilters.map((f) => (
              <li key={f} className="notification-item">
                {f}
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </section>
  );
}

export default BuyerHome;

