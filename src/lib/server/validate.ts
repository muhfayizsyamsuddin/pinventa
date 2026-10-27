import { RADII } from "@/lib/config";
import { INDUSTRY_TAGS } from "@/lib/server/industries";
import { DiscoverError } from "@/lib/server/util";
import type { RadiusKm } from "@/types/pinventa";
import type { DiscoverRequest } from "@/types/discover";

export interface ParsedLocation {
  raw: string;
  coordinates: { lat: number; lng: number } | null;
}

const MAX_LOCATION_LENGTH = 200;
const COORD_RE = /^\s*([+-]?\d{1,3}(?:\.\d+)?)\s*[,;\s]\s*([+-]?\d{1,3}(?:\.\d+)?)\s*$/;

/** Returns coordinates if `value` is a "lat, lng" pair, null if it is a place name. */
export function parseCoordinates(value: string): { lat: number; lng: number } | null {
  const m = COORD_RE.exec(value);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new DiscoverError(
      "INVALID_INPUT",
      "Coordinates are out of range. Latitude must be between -90 and 90, longitude between -180 and 180.",
      400,
      false,
      "location",
    );
  }
  return { lat, lng };
}

export function validateRequest(body: unknown): DiscoverRequest & { parsed: ParsedLocation } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new DiscoverError("INVALID_INPUT", "Request body must be a JSON object.", 400);
  }
  const { location, radiusKm, industry } = body as Record<string, unknown>;

  if (typeof location !== "string" || !location.trim()) {
    throw new DiscoverError("INVALID_INPUT", "Enter a place name, address, or coordinates.", 400, false, "location");
  }
  const loc = location.trim();
  if (loc.length > MAX_LOCATION_LENGTH) {
    throw new DiscoverError(
      "INVALID_INPUT",
      `Location must be at most ${MAX_LOCATION_LENGTH} characters.`,
      400,
      false,
      "location",
    );
  }

  const radius = typeof radiusKm === "string" ? Number(radiusKm) : radiusKm;
  if (typeof radius !== "number" || !(RADII as number[]).includes(radius)) {
    throw new DiscoverError(
      "INVALID_INPUT",
      `Radius must be one of: ${RADII.join(", ")} km.`,
      400,
      false,
      "radiusKm",
    );
  }

  if (typeof industry !== "string" || !Object.hasOwn(INDUSTRY_TAGS, industry)) {
    throw new DiscoverError(
      "INVALID_INPUT",
      `Select a supported industry (${Object.keys(INDUSTRY_TAGS).join(", ")}).`,
      400,
      false,
      "industry",
    );
  }

  return {
    location: loc,
    radiusKm: radius as RadiusKm,
    industry,
    parsed: { raw: loc, coordinates: parseCoordinates(loc) },
  };
}
