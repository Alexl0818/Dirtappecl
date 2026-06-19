import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { api } from "../lib/api";

const SellerListingContext = createContext(null);

// Listings now live on the server (shared across users), not localStorage.
// `listings` holds ALL active listings (buyers browse them); screens that want
// only the current seller's listings filter by sellerEmail.

export function SellerListingProvider({ children }) {
  const { user, ready } = useAuth();
  const [listings, setListings] = useState([]);

  async function refresh() {
    try {
      const data = await api.get("/listings");
      setListings(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("SellerListingContext: load failed", e.message);
      setListings([]);
    }
  }

  // (Re)load whenever the signed-in user changes.
  useEffect(() => {
    if (ready && user) refresh();
    else setListings([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  async function addListing(listing) {
    const created = await api.post("/listings", listing);
    setListings((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);
    return created;
  }

  async function updateListing(id, patch) {
    const updated = await api.patch(`/listings/${id}`, patch);
    setListings((prev) =>
      (Array.isArray(prev) ? prev : []).map((l) =>
        String(l.id) === String(id) ? updated : l
      )
    );
    return updated;
  }

  async function removeListing(id) {
    await api.del(`/listings/${id}`);
    setListings((prev) =>
      (Array.isArray(prev) ? prev : []).filter((l) => String(l.id) !== String(id))
    );
  }

  async function clearListings() {
    const mine = listings.filter((l) => l.sellerEmail === user?.email);
    await Promise.all(mine.map((l) => api.del(`/listings/${l.id}`).catch(() => {})));
    refresh();
  }

  const value = useMemo(
    () => ({
      listings,
      addListing,
      updateListing,
      removeListing,
      clearListings,
      setListings,
      refresh,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [listings, user]
  );

  return (
    <SellerListingContext.Provider value={value}>
      {children}
    </SellerListingContext.Provider>
  );
}

export function useSellerListings() {
  const ctx = useContext(SellerListingContext);
  if (!ctx) {
    throw new Error(
      "useSellerListings must be used inside <SellerListingProvider>"
    );
  }
  return ctx;
}
