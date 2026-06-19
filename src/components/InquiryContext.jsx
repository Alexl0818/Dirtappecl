import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const InquiryContext = createContext(null);

const LS_KEY = "dirtapp_buyer_requests";

export function InquiryProvider({ children }) {
  const [requests, setRequests] = useState([]);

  // Load from localStorage on boot
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const parsed = JSON.parse(raw || "[]");
      setRequests(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      console.error("InquiryContext: failed to load localStorage", e);
      setRequests([]);
    }
  }, []);

  // Persist to localStorage any time requests change
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(requests));
    } catch (e) {
      console.error("InquiryContext: failed to save localStorage", e);
    }
  }, [requests]);

  // Public API (keep it simple + stable)
  function addRequest(request) {
    setRequests((prev) => [request, ...(Array.isArray(prev) ? prev : [])]);
  }

  function updateRequest(id, patch) {
    setRequests((prev) =>
      (Array.isArray(prev) ? prev : []).map((r) =>
        String(r?.id) === String(id) ? { ...r, ...patch } : r
      )
    );
  }

  function clearRequests() {
    setRequests([]);
  }

  const value = useMemo(
    () => ({
      requests,
      // alias: seller screens read these as "inquiries"
      inquiries: requests,
      addRequest,
      updateRequest,
      clearRequests,
      // expose setter too (handy for edits later)
      setRequests,
    }),
    [requests]
  );

  return <InquiryContext.Provider value={value}>{children}</InquiryContext.Provider>;
}

// ✅ This is what your screens are trying to import
export function useInquiry() {
  const ctx = useContext(InquiryContext);
  if (!ctx) {
    throw new Error("useInquiry must be used inside <InquiryProvider>.");
  }
  return ctx;
}
