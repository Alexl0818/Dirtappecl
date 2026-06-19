import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "./GlassCard";
import BottomNav from "./BottomNav";
import { api } from "../lib/api";

export default function MessagesInbox() {
  const navigate = useNavigate();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get("/threads")
      .then((t) => active && (setThreads(Array.isArray(t) ? t : []), setLoading(false)))
      .catch(() => active && (setThreads([]), setLoading(false)));
    return () => {
      active = false;
    };
  }, []);

  const open = (t) =>
    navigate("/messages/thread", {
      state: {
        inquiry: {
          id: t.threadId,
          myRole: t.myRole,
          otherName: t.otherName,
          material: t.material,
          quantity: t.quantity,
          unit: t.unit,
          location: t.address,
        },
      },
    });

  return (
    <div className="app-root">
      <main className="app-main">
        <div className="dashboard-header">
          <div>
            <h2 className="section-title">Messages</h2>
            <p className="section-subtitle">Your conversations.</p>
          </div>
        </div>

        {loading ? (
          <GlassCard className="dashboard-card">
            <div className="card-description">Loading…</div>
          </GlassCard>
        ) : threads.length === 0 ? (
          <GlassCard className="dashboard-card">
            <div className="card-title">No messages yet</div>
            <div className="card-description">
              When you message a buyer or seller about a request, the conversation
              shows up here.
            </div>
          </GlassCard>
        ) : (
          <div className="dashboard-grid">
            {threads.map((t) => (
              <GlassCard
                key={t.threadId}
                className="dashboard-card nav-card"
                onClick={() => open(t)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div className="card-title">{t.otherName}</div>
                  <span className="status-pill status-draft">{t.myRole}</span>
                </div>
                <div className="card-description" style={{ marginTop: 6 }}>
                  {t.title}
                </div>
                {t.lastText ? (
                  <div style={{ marginTop: 6, fontSize: "0.85rem", opacity: 0.8 }}>
                    {t.lastText}
                  </div>
                ) : null}
              </GlassCard>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
