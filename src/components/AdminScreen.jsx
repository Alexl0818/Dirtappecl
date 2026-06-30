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
  const [newLabel, setNewLabel] = useState("");
  const [newMax, setNewMax] = useState("");
  const [copied, setCopied] = useState("");

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

  async function setInviteOnly(next) {
    setBusyId("invite-toggle");
    try {
      await api.post("/admin/settings", { inviteOnly: next });
      setData((d) => ({ ...d, settings: { ...d.settings, inviteOnly: next } }));
    } catch (e) {
      alert(e.message || "Couldn't update the setting.");
    } finally {
      setBusyId(null);
    }
  }

  async function createCode() {
    setBusyId("create-code");
    try {
      const max = parseInt(newMax, 10);
      const entry = await api.post("/admin/invite-codes", {
        label: newLabel.trim(),
        maxUses: Number.isFinite(max) && max > 0 ? max : null,
      });
      setData((d) => ({ ...d, inviteCodes: [entry, ...(d.inviteCodes || [])] }));
      setNewLabel("");
      setNewMax("");
    } catch (e) {
      alert(e.message || "Couldn't create the code.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteCode(code) {
    if (!window.confirm(`Delete invite code ${code}? People who already joined keep their accounts.`))
      return;
    setBusyId(code);
    try {
      await api.del(`/admin/invite-codes/${encodeURIComponent(code)}`);
      setData((d) => ({ ...d, inviteCodes: d.inviteCodes.filter((x) => x.code !== code) }));
    } catch (e) {
      alert(e.message || "Couldn't delete the code.");
    } finally {
      setBusyId(null);
    }
  }

  function copyCode(code) {
    try {
      navigator.clipboard?.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      /* ignore */
    }
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

      {/* Access / invite-only */}
      {data ? (
        <GlassCard className="dashboard-card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Invite-only signups</div>
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>
                {data.settings?.inviteOnly
                  ? "ON — new people need a code to join."
                  : "OFF — anyone can sign up."}
              </div>
            </div>
            <button
              onClick={() => setInviteOnly(!data.settings?.inviteOnly)}
              disabled={busyId === "invite-toggle"}
              style={{
                flexShrink: 0,
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid rgba(134,239,172,0.5)",
                background: data.settings?.inviteOnly ? "rgba(6,78,59,0.8)" : "rgba(15,23,42,0.6)",
                color: data.settings?.inviteOnly ? "#bbf7d0" : "#e2e8f0",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {data.settings?.inviteOnly ? "Turn OFF" : "Turn ON"}
            </button>
          </div>

          {/* Create code */}
          <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              placeholder="Label (e.g. Joe at ACME)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              style={codeInput(1)}
            />
            <input
              placeholder="Max uses (blank = ∞)"
              value={newMax}
              onChange={(e) => setNewMax(e.target.value.replace(/[^0-9]/g, ""))}
              inputMode="numeric"
              style={codeInput(0, 130)}
            />
            <button
              onClick={createCode}
              disabled={busyId === "create-code"}
              className="primary-button"
              style={{ padding: "8px 14px", fontSize: 13 }}
            >
              {busyId === "create-code" ? "…" : "+ Code"}
            </button>
          </div>

          {/* Code list */}
          {data.inviteCodes && data.inviteCodes.length > 0 ? (
            <div style={{ marginTop: 12 }}>
              {data.inviteCodes.map((c) => (
                <div
                  key={c.code}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    padding: "8px 0",
                    borderTop: "1px solid rgba(148,163,184,0.15)",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <span
                      onClick={() => copyCode(c.code)}
                      title="Click to copy"
                      style={{
                        fontFamily: "monospace",
                        fontSize: 14,
                        fontWeight: 700,
                        letterSpacing: 1,
                        cursor: "pointer",
                        color: "#bbf7d0",
                      }}
                    >
                      {c.code}
                    </span>
                    {copied === c.code ? (
                      <span style={{ fontSize: 11, color: "#86efac", marginLeft: 6 }}>copied ✓</span>
                    ) : null}
                    <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
                      {c.label ? `${c.label} · ` : ""}
                      used {c.uses || 0}
                      {c.maxUses ? ` / ${c.maxUses}` : " (no limit)"}
                      {c.maxUses && (c.uses || 0) >= c.maxUses ? " · used up" : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteCode(c.code)}
                    disabled={busyId === c.code}
                    style={{
                      flexShrink: 0,
                      padding: "5px 10px",
                      borderRadius: 7,
                      border: "1px solid rgba(248,113,113,0.4)",
                      background: "transparent",
                      color: "#fca5a5",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 12, opacity: 0.6, marginTop: 12, marginBottom: 0 }}>
              No codes yet. Create one above, then share it with people you invite.
            </p>
          )}
        </GlassCard>
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

const codeInput = (grow, width) => ({
  flex: grow ? "1 1 160px" : `0 0 ${width || 120}px`,
  minWidth: 0,
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid rgba(148,163,184,0.6)",
  background: "rgba(15,23,42,0.9)",
  color: "white",
  fontSize: 13,
});

const sectionTitle = { fontSize: 14, fontWeight: 600, marginBottom: 8 };
const empty = { fontSize: 13, opacity: 0.6, marginBottom: 12 };

export default AdminScreen;
