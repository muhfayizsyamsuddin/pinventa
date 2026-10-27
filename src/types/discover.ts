import type { BusinessResult, RadiusKm } from "@/types/pinventa";

/** Wire types for POST /api/discover. Safe to import from client code. */

export interface DiscoverRequest {
  location: string;
  radiusKm: RadiusKm;
  industry: string;
}

export interface DiscoverCenter {
  lat: number;
  lng: number;
  /** Human-readable label: the user's input, or the geocoder's display name. */
  label: string;
  source: "coordinates" | "geocoded";
}

export interface DiscoverMeta {
  /** Elements returned by Overpass before filtering/dedup. */
  rawElements: number;
  returned: number;
  /** Elements dropped because the source lists no name (we never invent one). */
  skippedUnnamed: number;
  /** Clear duplicates merged into one record. */
  duplicatesMerged: number;
  /** True if Overpass hit our element limit or we capped the list. */
  truncated: boolean;
  fetchedAt: string;
  geocodeCached?: boolean;
}

export interface DiscoverSuccess {
  ok: true;
  query: DiscoverRequest;
  center: DiscoverCenter;
  businesses: BusinessResult[];
  meta: DiscoverMeta;
}

export type DiscoverErrorCode =
  | "INVALID_INPUT"
  | "GEOCODE_NOT_FOUND"
  | "GEOCODE_TIMEOUT"
  | "GEOCODE_RATE_LIMITED"
  | "GEOCODE_ERROR"
  | "OVERPASS_TIMEOUT"
  | "OVERPASS_RATE_LIMITED"
  | "OVERPASS_ERROR"
  | "INTERNAL";

export interface DiscoverFailure {
  ok: false;
  error: {
    code: DiscoverErrorCode;
    message: string;
    field?: "location" | "radiusKm" | "industry";
    retryable: boolean;
  };
}

export type DiscoverResponse = DiscoverSuccess | DiscoverFailure;
