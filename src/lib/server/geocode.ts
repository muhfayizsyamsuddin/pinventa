import { serverConfig } from "@/lib/server/env";
import { DiscoverError, TtlCache, logDiag, singleton } from "@/lib/server/util";

/**
 * Forward geocoding via Nominatim (or a compatible provider set through
 * GEOCODER_BASE_URL). Follows https://operations.osmfoundation.org/policies/nominatim/ :
 * one request per user search (no autocomplete), identifying User-Agent,
 * at most 1 request/second (serialized queue), and cached results.
 */

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

const MIN_INTERVAL_MS = 1100;
const MAX_QUEUE = 5;

const limiter = singleton("nominatim_limiter", () => ({
  chain: Promise.resolve() as Promise<unknown>,
  last: 0,
  pending: 0,
}));
const cache = singleton("nominatim_cache", () => new TtlCache<GeocodeResult>(500));

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function throttled<T>(fn: () => Promise<T>): Promise<T> {
  if (limiter.pending >= MAX_QUEUE) {
    throw new DiscoverError(
      "GEOCODE_RATE_LIMITED",
      "Too many location lookups are queued. Wait a few seconds and try again.",
      429,
      true,
    );
  }
  limiter.pending++;
  const run = limiter.chain.then(async () => {
    const wait = limiter.last + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await sleep(wait);
    limiter.last = Date.now();
    try {
      return await fn();
    } finally {
      limiter.pending--;
    }
  });
  limiter.chain = run.catch(() => undefined);
  return run;
}

async function lookup(query: string): Promise<GeocodeResult> {
  const cfg = serverConfig();
  const url = new URL(`${cfg.nominatimBaseUrl}/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "User-Agent": cfg.userAgent, Accept: "application/json" },
      signal: AbortSignal.timeout(cfg.geocodeTimeoutMs),
      cache: "no-store",
    });
  } catch (err) {
    if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
      throw new DiscoverError(
        "GEOCODE_TIMEOUT",
        "The location lookup timed out. Try again, or enter latitude, longitude directly.",
        504,
        true,
      );
    }
    throw new DiscoverError(
      "GEOCODE_ERROR",
      "The location lookup service could not be reached. Try again, or enter latitude, longitude directly.",
      502,
      true,
    );
  }

  if (res.status === 429 || res.status === 403) {
    throw new DiscoverError(
      "GEOCODE_RATE_LIMITED",
      "The location lookup service is rate limiting requests. Wait a moment and retry, or enter latitude, longitude directly.",
      429,
      true,
    );
  }
  if (!res.ok) {
    throw new DiscoverError(
      "GEOCODE_ERROR",
      `The location lookup service returned an error (HTTP ${res.status}).`,
      502,
      true,
    );
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new DiscoverError("GEOCODE_ERROR", "The location lookup service returned an unreadable response.", 502, true);
  }

  const first = Array.isArray(data) ? (data[0] as Record<string, unknown> | undefined) : undefined;
  const lat = Number(first?.lat);
  const lng = Number(first?.lon);
  if (!first || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new DiscoverError(
      "GEOCODE_NOT_FOUND",
      `No place matched "${query}". Check the spelling, add the city or country, or enter latitude, longitude.`,
      404,
    );
  }
  return {
    lat,
    lng,
    displayName: typeof first.display_name === "string" ? first.display_name : query,
  };
}

/** Runs one upstream lookup and logs outcome + duration only (no query text, address or coordinates). */
async function timedLookup(query: string): Promise<GeocodeResult> {
  const started = Date.now();
  try {
    const result = await lookup(query);
    logDiag("geocode", "ok", { ms: Date.now() - started });
    return result;
  } catch (err) {
    logDiag("geocode", "fail", {
      ms: Date.now() - started,
      code: err instanceof DiscoverError ? err.code : "UNEXPECTED",
      errName: err instanceof Error ? err.name : typeof err,
    });
    throw err;
  }
}

export async function geocode(query: string): Promise<{ result: GeocodeResult; cached: boolean }> {
  const cfg = serverConfig();
  const key = `${cfg.nominatimBaseUrl}|${query.trim().toLowerCase().replace(/\s+/g, " ")}`;
  const { value, cached } = await cache.get(key, cfg.geocodeCacheTtlMs, () => throttled(() => timedLookup(query)));
  return { result: value, cached };
}
