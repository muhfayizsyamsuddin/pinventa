/** Small server-side helpers: errors, TTL cache with in-flight dedupe, haversine. */

import type { DiscoverErrorCode } from "@/types/discover";

export class DiscoverError extends Error {
  constructor(
    public code: DiscoverErrorCode,
    message: string,
    public status: number,
    public retryable = false,
    public field?: "location" | "radiusKm" | "industry",
  ) {
    super(message);
  }
}

/**
 * Minimal server-side diagnostic log (stdout of the Next.js server only; never
 * sent to the browser). Callers pass only short, non-sensitive fields: stage,
 * failure kind, err.name, HTTP status, duration. Strings are flattened and cut
 * to 80 chars as a safety net. Never pass queries, addresses, coordinates,
 * headers, env values or response bodies.
 */
export function logDiag(
  stage: "geocode" | "overpass",
  outcome: "ok" | "fail",
  fields: Record<string, string | number | boolean | undefined>,
): void {
  const parts = Object.entries(fields)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${typeof v === "string" ? v.replace(/\s+/g, " ").slice(0, 80) : v}`);
  const line = `[discover:${stage}] ${outcome} ${parts.join(" ")}`;
  if (outcome === "fail") console.warn(line);
  else console.info(line);
}

interface Entry<T> {
  expires: number;
  value: Promise<T>;
}

/** Caches successful results (and shares in-flight requests). Failures are evicted. */
export class TtlCache<T> {
  private map = new Map<string, Entry<T>>();
  constructor(private max = 200) { }

  async get(key: string, ttlMs: number, load: () => Promise<T>): Promise<{ value: T; cached: boolean }> {
    const now = Date.now();
    const hit = this.map.get(key);
    if (hit && hit.expires > now) return { value: await hit.value, cached: true };

    if (this.map.size >= this.max) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
    const value = load();
    this.map.set(key, { expires: now + ttlMs, value });
    try {
      return { value: await value, cached: false };
    } catch (err) {
      if (this.map.get(key)?.value === value) {
        this.map.delete(key);
      }
      throw err;
    }
  }
}

/** Process-wide singletons that survive dev hot reloads. */
export function singleton<T>(name: string, create: () => T): T {
  const g = globalThis as unknown as Record<string, unknown>;
  const key = `__pinventa_${name}`;
  if (!g[key]) g[key] = create();
  return g[key] as T;
}

export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371.0088 * Math.asin(Math.sqrt(h));
}
