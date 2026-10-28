import { geocode } from "@/lib/server/geocode";
import { normalizeAll } from "@/lib/server/normalize";
import { searchOverpass } from "@/lib/server/overpass";
import { serverConfig } from "@/lib/server/env";
import { DiscoverError } from "@/lib/server/util";
import { validateRequest } from "@/lib/server/validate";
import type { DiscoverCenter, DiscoverFailure, DiscoverSuccess } from "@/types/discover";

// POST handlers are never cached by Next.js; responses also set Cache-Control: no-store.

function failure(err: DiscoverError): Response {
  const body: DiscoverFailure = {
    ok: false,
    error: { code: err.code, message: err.message, field: err.field, retryable: err.retryable },
  };
  return Response.json(body, { status: err.status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request): Promise<Response> {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new DiscoverError("INVALID_INPUT", "Request body must be valid JSON.", 400);
    }
    const input = validateRequest(body);

    let center: DiscoverCenter;
    let geocodeCached: boolean | undefined;
    if (input.parsed.coordinates) {
      const { lat, lng } = input.parsed.coordinates;
      center = { lat, lng, label: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, source: "coordinates" };
    } else {
      const { result, cached } = await geocode(input.location);
      geocodeCached = cached;
      center = { lat: result.lat, lng: result.lng, label: result.displayName, source: "geocoded" };
    }

    const { elements, limitReached } = await searchOverpass(center.lat, center.lng, input.radiusKm, input.industry);
    const { businesses, skippedUnnamed, duplicatesMerged } = normalizeAll(elements, center, input.radiusKm);

    const { maxResults } = serverConfig();
    const capped = businesses.slice(0, maxResults);

    const result: DiscoverSuccess = {
      ok: true,
      query: { location: input.location, radiusKm: input.radiusKm, industry: input.industry },
      center,
      businesses: capped,
      meta: {
        rawElements: elements.length,
        returned: capped.length,
        skippedUnnamed,
        duplicatesMerged,
        truncated: limitReached || businesses.length > capped.length,
        fetchedAt: new Date().toISOString(),
        geocodeCached,
      },
    };
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof DiscoverError) return failure(err);
    console.error("[api/discover] unexpected error", err);
    return failure(new DiscoverError("INTERNAL", "Something went wrong while searching. Try again.", 500, true));
  }
}
