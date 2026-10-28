/**
 * Server-only provider configuration. Never import this from a client
 * component: values come from process.env and must not reach the browser.
 */

function num(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function serverConfig() {
  return {
    nominatimBaseUrl: (process.env.GEOCODER_BASE_URL ?? "https://nominatim.openstreetmap.org").replace(/\/+$/, ""),
    overpassUrl: process.env.OVERPASS_URL ?? "https://overpass-api.de/api/interpreter",
    overpassApiKey: process.env.OVERPASS_API_KEY?.trim() || undefined,
    userAgent:
      process.env.APP_USER_AGENT ??
      "Pinventa/0.1 (MAXY Academy hackathon prototype; set APP_USER_AGENT with a contact address)",
    geocodeTimeoutMs: num(process.env.GEOCODER_TIMEOUT_MS, 8000),
    overpassTimeoutMs: num(process.env.OVERPASS_TIMEOUT_MS, 30000),
    /** Max elements requested from Overpass (`out ... N`). */
    overpassElementLimit: num(process.env.OVERPASS_ELEMENT_LIMIT, 200),
    /** Max businesses returned to the client. */
    maxResults: num(process.env.DISCOVER_MAX_RESULTS, 50),
    geocodeCacheTtlMs: num(process.env.GEOCODER_CACHE_TTL_MS, 24 * 60 * 60 * 1000),
    overpassCacheTtlMs: num(process.env.OVERPASS_CACHE_TTL_MS, 5 * 60 * 1000),
  };
}
