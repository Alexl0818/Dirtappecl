import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const HaulBidContext = createContext(null);

const LS_OPPS = "dirtapp_haul_opportunities";
const LS_BIDS = "dirtapp_haul_bids";

export function HaulBidProvider({ children }) {
  const [opportunities, setOpportunities] = useState([]);
  const [bids, setBids] = useState([]); // each bid: { id, oppId, amount, availability, notes, createdAt, status }
  const [ready, setReady] = useState(false);

  // Load opportunities
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_OPPS);
      const parsed = JSON.parse(raw || "[]");
      setOpportunities(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      console.error("HaulBidContext: opportunities load failed", e);
      setOpportunities([]);
    }
  }, []);

  // Load bids
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_BIDS);
      const parsed = JSON.parse(raw || "[]");
      setBids(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      console.error("HaulBidContext: bids load failed", e);
      setBids([]);
    }
    setReady(true);
  }, []);

  // Persist opportunities (after the initial load, so we never clobber data).
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(LS_OPPS, JSON.stringify(opportunities));
    } catch (e) {
      console.error("HaulBidContext: opportunities save failed", e);
    }
  }, [opportunities, ready]);

  // Persist bids (after the initial load).
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(LS_BIDS, JSON.stringify(bids));
    } catch (e) {
      console.error("HaulBidContext: bids save failed", e);
    }
  }, [bids, ready]);

  function addOpportunity(opp) {
    setOpportunities((prev) => [opp, ...(Array.isArray(prev) ? prev : [])]);
  }

  function clearOpportunities() {
    setOpportunities([]);
  }

  function addBid(bid) {
    setBids((prev) => [bid, ...(Array.isArray(prev) ? prev : [])]);
  }

  function clearBids() {
    setBids([]);
  }

  function getBidsForOpportunity(oppId) {
    const arr = Array.isArray(bids) ? bids : [];
    return arr.filter((b) => String(b?.oppId) === String(oppId));
  }

  const value = useMemo(
    () => ({
      opportunities,
      setOpportunities,
      addOpportunity,
      clearOpportunities,

      bids,
      setBids,
      addBid,
      clearBids,
      getBidsForOpportunity,
    }),
    [opportunities, bids]
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
