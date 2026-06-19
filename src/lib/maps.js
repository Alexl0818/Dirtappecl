// Map + geocoding helpers.
//
// The map uses Leaflet + OpenStreetMap tiles (free, no API key, no billing).
// Geocoding (address -> lat/lng) uses the free OpenStreetMap Nominatim service.
// Nominatim's usage policy asks for low volume (<= ~1 request/sec), which fits
// one lookup per listing/request creation. Everything is best-effort: if a
// lookup fails, records still save without coordinates.

// Default map center (continental US) used when there's nothing to show yet.
export const DEFAULT_CENTER = { lat: 39.5, lng: -98.35 };
export const DEFAULT_ZOOM = 4;

// Geocode a free-text address into { lat, lng, formatted } via Nominatim.
// Returns null on any failure so callers can treat it as best-effort.
export async function geocodeAddress(address) {
  const text = String(address || "").trim();
  if (!text) return null;

  try {
    const url =
      "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" +
      encodeURIComponent(text);

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;

    const results = await res.json();
    const hit = Array.isArray(results) ? results[0] : null;
    if (!hit) return null;

    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

    return { lat, lng, formatted: hit.display_name || text };
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

// Great-circle distance in miles between two {lat,lng} points. Returns null if
// either point lacks coordinates. This is "as the crow flies" — a reasonable
// proxy for haul distance until real routing is added.
export function distanceMiles(a, b) {
  if (!hasCoords(a) || !hasCoords(b)) return null;
  const R = 3958.8; // Earth radius in miles
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}
