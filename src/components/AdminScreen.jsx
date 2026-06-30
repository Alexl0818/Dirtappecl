// src/components/AdminScreen.jsx
//
// Admin-only moderation panel. Lists every listing and request in the system
// (newest first) with who posted it and when, plus a Delete button on each so
// the owner can remove spam or stale posts. Access is gated two ways: the route
// only renders for user.isAdmin, and the /admin/overview API itself is
// admin-only — a non-admin who guesses the URL gets nothing.

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "./GlassCard";
import BottomNav from "./BottomNav";
import { useAuth } from "./AuthContext";
import { api } from "../lib/api";

const fmtDate = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(iso).slice(0, 10);
  }
};

const AdminScreen = () => {
  const navigate = useNavigate();
  const { user, ready, isAuthenticated } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/overview");
      setData(res);
    } catch (e) {
      setError(e.message || "Couldn't load posts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready && isAuthenticated && user?.isAdmin) load();
  }, [ready, isAuthenticated, user]);

  // Not an admin → don't reveal anything.
  if (ready && (!isAuthenticated || !user?.isAdmin)) {
    return (
      <div className="app-root">
        <main className="app-main" style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>
          <h1 className="section-title">Admin</h1>
          <GlassCard className="dashboard-card" style={{ marginTop: 12 }}>
            <div className="card-title">Not available</div>
            <div className="card-description">This area is for site admins only.</div>
            <button className="primary-button full-width" onClick={() => navigate("/buyer/home")}>
              Back to app
            </button>
          </GlassCard>
        </main>
        <BottomNav />
      </div>
    );
  }

  async function toggleSuspend(acct) {
    const next = !acct.suspended;
    const verb = next ? "Suspend" : "Un-suspend";
    if (!window.confirm(`${verb} ${acct.name || acct.email}? ${next ? "They won't be able to log in or post." : "They'll regain access."}`))
      return;
    setBusyId(acct.email);
    try {
      await api.post("/admin/suspend", { email: acct.email, suspended: next });
      setData((d) => ({
        ...d,
        accounts: d.accounts.map((a) =>
          a.email === acct.email ? { ...a, suspended: next } : a
        ),
      }));
    } catch (e) {
      alert(e.message || "Couldn't update that account.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(kind, item) {
    const what =
      kind === "listing"
        ? `listing "${item.material || "(no title)"}"`
        : `request "${item.material || "(no title)"}"`;
    const who =
      kind === "listing"
        ? item.sellerName || item.sellerEmail || "unknown"
        : item.buyerName || item.buyerEmail || "unknown";
    if (!window.confirm(`Delete ${what} posted by ${who}? This can't be undone.`)) return;

    setBusyId(item.id);
    try {
      await api.del(`/${kind === "listing" ? "listings" : "requests"}/${item.id}`);
      setData((d) => ({
        ...d,
        listings: kind === "listing" ? d.listings.filter((x) => x.id !== item.id) : d.listings,
        requests: kind === "request" ? d.requests.filter((x) => x.id !== item.id) : d.requests,
        counts: {
          ...d.counts,
          listings: kind === "listing" ? d.counts.listings - 1 : d.counts.listings,
          requests: kind === "request" ? d.counts.requests - 1 : d.counts.requests,
        },
      }));
    } catch (e) {
      alert(e.message || "Delete failed.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "16px 16px 90px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <h1 style={{ marginBottom: 4, fontSize: 22, fontWeight: 600 }}>Manage posts</h1>
        <button className="ghost-button" onClick={load} disabled={loading} style={{ fontSize: 13 }}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      <p style={{ marginBottom: 16, opacity: 0.8, fontSize: 13 }}>
        Admin tools — remove spam or stale posts. Deletions are permanent.
      </p>

      {error ? (
        <GlassCard className="dashboard-card" style={{ marginBottom: 12 }}>
          <div className="card-description" style={{ color: "#fca5a5" }}>{error}</div>
        </GlassCard>
      ) : null}

      {data ? (
        <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 12 }}>
          {data.counts.listings} listings · {data.counts.requests} requests ·{" "}
          {data.counts.accounts} accounts
        </p>
      ) : null}

      {/* Listings */}
      <h2 style={sectionTitle}>Listings ({data?.listings?.length ?? 0})</h2>
      {data && data.listings.length === 0 ? (
        <p style={empty}>No listings.</p>
      ) : (
        data?.listings.map((l) => (
          <PostRow
            key={l.id}
            title={l.material || "(no material)"}
            sub={[l.location, l.quantity && `${l.quantity} ${l.unit || ""}`.trim(), l.price]
              .filter(Boolean)
              .join(" · ")}
            who={l.sellerName || l.sellerEmail || "unknown"}
            email={l.sellerEmail}
            date={fmtDate(l.createdAt)}
            busy={busyId === l.id}
            onDelete={() => remove("listing", l)}
          />
        ))
      )}

      {/* Requests */}
      <h2 style={{ ...sectionTitle, marginTop: 20 }}>Requests ({data?.requests?.length ?? 0})</h2>
      {data && data.requests.length === 0 ? (
        <p style={empty}>No requests.</p>
      ) : (
        data?.requests.map((r) => (
          <PostRow
            key={r.id}
            title={r.material || "(no material)"}
            sub={[r.location, r.quantity && `${r.quantity} ${r.unit || ""}`.trim()]
              .filter(Boolean)
              .join(" · ")}
            who={r.buyerName || r.buyerEmail || "unknown"}
            email={r.buyerEmail}
            date={fmtDate(r.createdAt)}
            busy={busyId === r.id}
            onDelete={() => remove("request", r)}
          />
        ))
      )}

      {/* Accounts */}
      <h2 style={{ ...sectionTitle, marginTop: 20 }}>People ({data?.accounts?.length ?? 0})</h2>
      {data && data.accounts.length === 0 ? (
        <p style={empty}>No accounts.</p>
      ) : (
        data?.accounts.map((a) => (
          <AccountRow
            key={a.email}
            acct={a}
            isSelf={a.email === user?.email}
            busy={busyId === a.email}
            onToggle={() => toggleSuspend(a)}
          />
        ))
      )}

      <BottomNav />
    </div>
  );
};

const PostRow = ({ title, sub, who, email, date, busy, onDelete }) => (
  <GlassCard className="dashboard-card" style={{ marginBottom: 10 }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div>
        {sub ? <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{sub}</div> : null}
        <div style={{ fontSize: 11, opacity: 0.65, marginTop: 4 }}>
          {who}
          {email && who !== email ? ` · ${email}` : ""}
          {date ? ` · ${date}` : ""}
        </div>
      </div>
      <button
        onClick={onDelete}
        disabled={busy}
        style={{
          flexShrink: 0,
          padding: "7px 12px",
          borderRadius: 8,
          border: "1px solid rgba(248,113,113,0.5)",
          background: busy ? "rgba(127,29,29,0.4)" : "rgba(127,29,29,0.7)",
          color: "#fee2e2",
          fontSize: 12,
          fontWeight: 600,
          cursor: busy ? "default" : "pointer",
        }}
      >
        {busy ? "…" : "Delete"}
      </button>
    </div>
  </GlassCard>
);

const AccountRow = ({ acct, isSelf, busy, onToggle }) => {
  const canSuspend = !acct.isAdmin && !isSelf;
  return (
    <GlassCard className="dashboard-card" style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            {acct.name || acct.email}
            {acct.isAdmin ? <span style={badge("#86efac", "#064e3b")}>admin</span> : null}
            {acct.suspended ? <span style={badge("#fca5a5", "#450a0a")}>suspended</span> : null}
          </div>
          <div style={{ fontSize: 11, opacity: 0.65, marginTop: 4 }}>
            {acct.email}
            {acct.company ? ` · ${acct.company}` : ""}
            {` · ${acct.listings} listings, ${acct.requests} requests`}
          </div>
        </div>
        {canSuspend ? (
          <button
            onClick={onToggle}
            disabled={busy}
            style={{
              flexShrink: 0,
              padding: "7px 12px",
              borderRadius: 8,
              border: acct.suspended ? "1px solid rgba(134,239,172,0.5)" : "1px solid rgba(251,191,36,0.5)",
              background: acct.suspended ? "rgba(6,78,59,0.7)" : "rgba(120,53,15,0.7)",
              color: acct.suspended ? "#bbf7d0" : "#fde68a",
              fontSize: 12,
              fontWeight: 600,
              cursor: busy ? "default" : "pointer",
            }}
          >
            {busy ? "…" : acct.suspended ? "Un-suspend" : "Suspend"}
          </button>
        ) : (
          <span style={{ flexShrink: 0, fontSize: 11, opacity: 0.5, paddingTop: 7 }}>
            {isSelf ? "you" : "—"}
          </span>
        )}
      </div>
    </GlassCard>
  );
};

const badge = (fg, bg) => ({
  marginLeft: 6,
  fontSize: 10,
  fontWeight: 600,
  padding: "1px 6px",
  borderRadius: 10,
  color: fg,
  background: bg,
  verticalAlign: "middle",
});

const sectionTitle = { fontSize: 14, fontWeight: 600, marginBottom: 8 };
const empty = { fontSize: 13, opacity: 0.6, marginBottom: 12 };

export default AdminScreen;
