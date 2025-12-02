import React from "react";
import GlassCard from "./GlassCard";

function HaulerDashboard() {
  const kpis = [
    { label: "Active Jobs", value: 6, trend: "2 starting today" },
    { label: "Available Trucks", value: 4, trend: "ready to dispatch" },
    { label: "Miles Today", value: 320, trend: "live total" },
  ];

  const jobs = [
    {
      id: "HAUL-331",
      route: "Mooresville ➝ Statesville",
      material: "Structural Fill",
      loads: "14 loads",
      status: "En Route",
    },
    {
      id: "HAUL-327",
      route: "Charlotte ➝ Concord",
      material: "Unsuitable / Haul-Off",
      loads: "9 loads",
      status: "Scheduled",
    },
    {
      id: "HAUL-319",
      route: "Huntersville ➝ Cornelius",
      material: "Topsoil",
      loads: "6 loads",
      status: "Completed",
    },
  ];

  const notices = [
    "Check DOT inspections for truck #204 before dispatch.",
    "Weather delay expected after 3 PM in North Charlotte.",
    "One open request is still unassigned to a truck.",
  ];

  return (
    <section className="seller-dashboard">
      <div className="dashboard-header">
        <div>
          <h2 className="section-title">Hauler Dashboard</h2>
          <p className="section-subtitle">
            Keep trucks loaded, routes clear, and jobs on schedule.
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
            <h3>Today&apos;s Hauls</h3>
            <button className="ghost-button">View all</button>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Route</th>
                  <th>Material</th>
                  <th>Loads</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td>{job.id}</td>
                    <td>{job.route}</td>
                    <td>{job.material}</td>
                    <td>{job.loads}</td>
                    <td>{job.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard className="side-column">
          <div className="card-header">
            <h3>Hauler Notes</h3>
          </div>
          <ul className="notification-list">
            {notices.map((note, idx) => (
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

export default HaulerDashboard;
