import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { api } from "../lib/api";

const InquiryContext = createContext(null);

// Buyer requests now live on the server. `requests` holds what the current user
// can see: their own requests + requests on listings they own (server-scoped).

export function InquiryProvider({ children }) {
  const { user, ready } = useAuth();
  const [requests, setRequests] = useState([]);

  async function refresh() {
    try {
      const data = await api.get("/requests");
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("InquiryContext: load failed", e.message);
      setRequests([]);
    }
  }

  useEffect(() => {
    if (ready && user) refresh();
    else setRequests([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  async function addRequest(request) {
    const created = await api.post("/requests", request);
    setRequests((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);
    return created;
  }

  async function updateRequest(id, patch) {
    const updated = await api.patch(`/requests/${id}`, patch);
    setRequests((prev) =>
      (Array.isArray(prev) ? prev : []).map((r) =>
        String(r.id) === String(id) ? updated : r
      )
    );
    return updated;
  }

  async function clearRequests() {
    const mine = requests.filter((r) => r.buyerEmail === user?.email);
    await Promise.all(mine.map((r) => api.del(`/requests/${r.id}`).catch(() => {})));
    refresh();
  }

  const value = useMemo(
    () => ({
      requests,
      inquiries: requests, // alias: seller screens read these as "inquiries"
      addRequest,
      updateRequest,
      clearRequests,
      setRequests,
      refresh,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [requests, user]
  );

  return <InquiryContext.Provider value={value}>{children}</InquiryContext.Provider>;
}

export function useInquiry() {
  const ctx = useContext(InquiryContext);
  if (!ctx) {
    throw new Error("useInquiry must be used inside <InquiryProvider>.");
  }
  return ctx;
}
