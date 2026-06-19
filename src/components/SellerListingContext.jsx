import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const SellerListingContext = createContext(null);

const LS_KEY = "dirtapp_seller_listings";

export function SellerListingProvider({ children }) {
  const [listings, setListings] = useState([]);

  // Load listings from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const parsed = JSON.parse(raw || "[]");
      setListings(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      console.error("SellerListingContext: load failed", e);
      setListings([]);
    }
  }, []);

  // Persist listings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(listings));
    } catch (e) {
      console.error("SellerListingContext: save failed", e);
    }
  }, [listings]);

  function addListing(listing) {
    setListings((prev) => [listing, ...(Array.isArray(prev) ? prev : [])]);
  }

  function clearListings() {
    setListings([]);
  }

  function updateListing(id, patch) {
    setListings((prev) =>
      (Array.isArray(prev) ? prev : []).map((l) =>
        String(l?.id) === String(id) ? { ...l, ...patch } : l
      )
    );
  }

  function removeListing(id) {
    setListings((prev) =>
      (Array.isArray(prev) ? prev : []).filter(
        (l) => String(l?.id) !== String(id)
      )
    );
  }

  const value = useMemo(
    () => ({
      listings,
      addListing,
      updateListing,
      removeListing,
      clearListings,
      setListings, // exposed for edits later
    }),
    [listings]
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
