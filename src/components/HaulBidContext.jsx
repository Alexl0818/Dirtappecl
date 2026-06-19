import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { api } from "../lib/api";

const HaulBidContext = createContext(null);

// Haul opportunities + bids now live on the server. `opportunities` holds open
// ones (for haulers) plus your own (as seller); `bids` holds your own (as hauler)
// plus bids on your opportunities (as seller) — all server-scoped.

export function HaulBidProvider({ children }) {
  const { user, ready } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [bids, setBids] = useState([]);

  async function refresh() {
    try {
      const [opps, bd] = await Promise.all([
        api.get("/opportunities"),
        api.get("/bids"),
      ]);
      setOpportunities(Array.isArray(opps) ? opps : []);
      setBids(Array.isArray(bd) ? bd : []);
    } catch (e) {
      console.error("HaulBidContext: load failed", e.message);
    }
  }

  useEffect(() => {
    if (ready && user) refresh();
    else {
      setOpportunities([]);
      setBids([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  async function addOpportunity(opp) {
    const created = await api.post("/opportunities", opp);
    setOpportunities((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);
    return created;
  }

  async function addBid(bid) {
    const created = await api.post("/bids", bid);
    setBids((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);
    return created;
  }

  // Atomic award on the server; merge the returned opp + bid updates locally.
  async function awardBid(oppId, bidId) {
    const { opportunity, bids: updated } = await api.post(
      `/opportunities/${oppId}/award`,
      { bidId }
    );
    setOpportunities((prev) =>
      prev.map((o) => (String(o.id) === String(oppId) ? opportunity : o))
    );
    setBids((prev) =>
      prev.map((b) => updated.find((u) => String(u.id) === String(b.id)) || b)
    );
    return opportunity;
  }

  async function clearOpportunities() {
    const mine = opportunities.filter((o) => o.sellerEmail === user?.email);
    await Promise.all(
      mine.map((o) => api.del(`/opportunities/${o.id}`).catch(() => {}))
    );
    refresh();
  }

  async function clearBids() {
    const mine = bids.filter((b) => b.haulerEmail === user?.email);
    await Promise.all(mine.map((b) => api.del(`/bids/${b.id}`).catch(() => {})));
    refresh();
  }

  function getBidsForOpportunity(oppId) {
    return (Array.isArray(bids) ? bids : []).filter(
      (b) => String(b?.oppId) === String(oppId)
    );
  }

  const value = useMemo(
    () => ({
      opportunities,
      bids,
      addOpportunity,
      addBid,
      awardBid,
      clearOpportunities,
      clearBids,
      getBidsForOpportunity,
      refresh,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [opportunities, bids, user]
  );

  return <HaulBidContext.Provider value={value}>{children}</HaulBidContext.Provider>;
}

export function useHaulBids() {
  const ctx = useContext(HaulBidContext);
  if (!ctx) throw new Error("useHaulBids must be used inside <HaulBidProvider>.");
  return ctx;
}

// Backwards-compatible alias — some screens import the singular name.
export const useHaulBid = useHaulBids;
