// Central place for Google Maps wiring.
//
// The API key is read from VITE_GOOGLE_MAPS_API_KEY (put it in a .env.local
// file at the project root, then restart the dev server). When the key is
// absent, the app degrades gracefully: map screens show a setup fallback and
// geocoding silently no-ops, so listings/requests still save (just without
// coordinates).

export const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

export function hasMapsKey() {
  return Boolean(GMAPS_KEY);
}

// Default map center (continental US) used when there's nothing to show yet.
export const DEFAULT_CENTER = { lat: 39.5, lng: -98.35 };
export const DEFAULT_ZOOM = 4;

// Geocode a free-text address into { lat, lng, formatted } using the Maps JS
// Geocoder. Requires the Google Maps script to already be loaded (i.e. a key
// is present and <APIProvider> has mounted). Returns null on any failure so
// callers can treat it as best-effort.
export async function geocodeAddress(address) {
  const text = String(address || "").trim();
  if (!text) return null;
  if (typeof window === "undefined" || !window.google?.maps?.Geocoder) return null;

  try {
    const geocoder = new window.google.maps.Geocoder();
    const { results } = await geocoder.geocode({ address: text });
    const hit = results?.[0];
    if (!hit?.geometry?.location) return null;
    const loc = hit.geometry.location;
    return {
      lat: typeof loc.lat === "function" ? loc.lat() : loc.lat,
      lng: typeof loc.lng === "function" ? loc.lng() : loc.lng,
      formatted: hit.formatted_address || text,
    };
  } catch (e) {
    console.warn("geocodeAddress failed:", e?.message || e);
    return null;
  }
}

// True if a record has usable coordinates.
export function hasCoords(rec) {
  return (
    rec &&
    typeof rec.lat === "number" &&
    typeof rec.lng === "number" &&
    !Number.isNaN(rec.lat) &&
    !Number.isNaN(rec.lng)
  );
}
