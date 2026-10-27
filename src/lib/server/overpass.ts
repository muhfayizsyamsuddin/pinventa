
import { serverConfig } from "@/lib/server/env";
import { INDUSTRY_TAGS } from "@/lib/server/industries";
import { DiscoverError, TtlCache, logDiag, singleton } from "@/lib/server/util";

/** One raw OSM element as returned by Overpass (`out center tags`). */
export interface OsmElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export interface OverpassResult {
  /** Raw OSM elements returned by Overpass. */
  elements: OsmElement[];
  /** True when the number of elements reached the requested limit. */
  limitReached: boolean;
}

const cache = singleton("overpass_cache", () => new TtlCache<OverpassResult>(100));

/**
 * Targeted query: only named office objects matching the selected industry,
 * within the requested area. Never queries without an industry filter.
 */
export function buildQuery(
  lat: number,
  lng: number,
  radiusM: number,
  industry: string,
  limit: number,
  timeoutS: number,
): string {
  const values = INDUSTRY_TAGS[industry];

  if (!values || values.length === 0) {
    throw new DiscoverError(
      "INVALID_INPUT",
      "Unsupported industry.",
      400,
      false,
      "industry",
    );
  }

  // Approximate bounding box around the requested radius.
  // Results are filtered by actual distance during normalization.
  const latDelta = radiusM / 111_320;
  const cosLat = Math.cos((lat * Math.PI) / 180);

  const lngDelta =
    Math.abs(cosLat) < 0.01
      ? Number.POSITIVE_INFINITY
      : radiusM / (111_320 * Math.abs(cosLat));

  const south = lat - latDelta;
  const north = lat + latDelta;
  const west = lng - lngDelta;
  const east = lng + lngDelta;

  // Fall back to a radius filter near the poles or across
  // the antimeridian, where a simple bounding box is unsuitable.
  const useBoundingBox =
    Number.isFinite(lngDelta) &&
    south >= -90 &&
    north <= 90 &&
    west >= -180 &&
    east <= 180;

  const spatialFilter = useBoundingBox
    ? `(${south},${west},${north},${east})`
    : `(around:${radiusM},${lat},${lng})`;

  const statements = values.map(
    (value) => `nwr["office"="${value}"]["name"]${spatialFilter};`,
  );

  return [
    `[out:json][timeout:${timeoutS}];`,
    "(",
    ...statements,
    ");",
    `out center tags ${limit};`,
  ].join("\n");
}

export async function searchOverpass(
  lat: number,
  lng: number,
  radiusKm: number,
  industry: string,
): Promise<OverpassResult> {
  const cfg = serverConfig();
  const radiusM = Math.round(radiusKm * 1000);
  const timeoutS = Math.max(
    5,
    Math.floor(cfg.overpassTimeoutMs / 1000) - 3,
  );

  const query = buildQuery(
    lat,
    lng,
    radiusM,
    industry,
    cfg.overpassElementLimit,
    timeoutS,
  );

  const key = `${cfg.overpassUrl}|${query}`;

  const { value } = await cache.get(
    key,
    cfg.overpassCacheTtlMs,
    () => run(query, cfg),
  );

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

async function run(
  query: string,
  cfg: ReturnType<typeof serverConfig>,
): Promise<OverpassResult> {
  const started = Date.now();
  const ms = () => Date.now() - started;

  let upstreamUrl: URL | undefined;
  let upstreamHost: string;

  try {
    upstreamUrl = new URL(cfg.overpassUrl);
    upstreamHost = upstreamUrl.hostname;
  } catch {
    upstreamHost = "invalid_url";
  }

  // Internal diagnostics only. Never log the query, credentials,
  // address, coordinates, or raw response body.
  const diag = (
    kind: string,
    extra: Record<string, string | number | boolean | undefined> = {},
  ) =>
    logDiag("overpass", "fail", {
      kind,
      ms: ms(),
      configuredTimeoutMs: cfg.overpassTimeoutMs,
      upstreamHost,
      ...extra,
    });

  let res: Response;

  try {
    const headers: Record<string, string> = {
      "User-Agent": cfg.userAgent,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    };

    if (cfg.overpassApiKey) {
      const trustedKeyDestination =
        upstreamUrl?.protocol === "https:" &&
        upstreamUrl.hostname === "api.overpass.ch" &&
        (upstreamUrl.port === "" || upstreamUrl.port === "443") &&
        upstreamUrl.username === "" &&
        upstreamUrl.password === "";

      if (trustedKeyDestination) {
        headers["X-API-Key"] = cfg.overpassApiKey;
      } else {
        console.warn(
          `[discover:overpass] API key omitted because destination "${upstreamHost}" is not an approved HTTPS endpoint.`,
        );
      }
    }

    res = await fetch(cfg.overpassUrl, {
      method: "POST",
      headers,
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(cfg.overpassTimeoutMs),
      cache: "no-store",
      // Do not forward a request carrying an API key through redirects.
      redirect: "error",
    });
  } catch (err) {
    const name = err instanceof Error ? err.name : typeof err;

    if (
      err instanceof Error &&
      (err.name === "TimeoutError" || err.name === "AbortError")
    ) {
      diag("internal_abort_timeout", { errName: name });

      throw new DiscoverError(
        "OVERPASS_TIMEOUT",
        "The OpenStreetMap data service timed out. Try again, or use a smaller radius.",
        504,
        true,
      );
    }

    // Log only the error name and a known network error code, not its message.
    const cause =
      err instanceof Error
        ? (err.cause as { code?: unknown } | undefined)
        : undefined;

    diag("network_error", {
      errName: name,
      errCode:
        typeof cause?.code === "string" ? cause.code : undefined,
    });

    throw new DiscoverError(
      "OVERPASS_ERROR",
      "The OpenStreetMap data service could not be reached. Check the endpoint configuration or try again shortly.",
      502,
      true,
    );
  }

  if (res.status === 429) {
    diag("upstream_http_non_2xx", { httpStatus: res.status });

    throw new DiscoverError(
      "OVERPASS_RATE_LIMITED",
      "The OpenStreetMap data service is rate limiting requests. Wait a minute and retry.",
      429,
      true,
    );
  }

  if (res.status === 504) {
    diag("upstream_http_non_2xx", { httpStatus: res.status });

    throw new DiscoverError(
      "OVERPASS_TIMEOUT",
      "The OpenStreetMap data service timed out. Try again, or use a smaller radius.",
      504,
      true,
    );
  }

  if (res.status === 503) {
    diag("upstream_service_busy", { httpStatus: res.status });

    throw new DiscoverError(
      "OVERPASS_ERROR",
      "The OpenStreetMap data service is temporarily busy. Try again shortly.",
      503,
      true,
    );
  }

  if (!res.ok) {
    diag("upstream_http_non_2xx", { httpStatus: res.status });

    throw new DiscoverError(
      "OVERPASS_ERROR",
      `The OpenStreetMap data service returned an error (HTTP ${res.status}).`,
      502,
      true,
    );
  }

  let parsed: unknown;

  try {
    parsed = await res.json();
  } catch (err) {
    diag("parse_error", {
      httpStatus: res.status,
      errName: err instanceof Error ? err.name : typeof err,
    });

    throw new DiscoverError(
      "OVERPASS_ERROR",
      "The OpenStreetMap data service returned an unreadable response.",
      502,
      true,
    );
  }

  // Validate the top-level response before accessing its properties.
  if (!isRecord(parsed) || !Array.isArray(parsed.elements)) {
    diag("invalid_response_shape", { httpStatus: res.status });

    throw new DiscoverError(
      "OVERPASS_ERROR",
      "The OpenStreetMap data service returned an invalid response.",
      502,
      true,
    );
  }

  const json = parsed as {
    elements: unknown[];
    remark?: unknown;
  };

  // The configured Overpass endpoint is expected to return OSM elements.
  const elements = json.elements as OsmElement[];

  // Overpass can return HTTP 200 alongside a runtime error and partial data.
  if (
    typeof json.remark === "string" &&
    /timed out|out of memory|runtime error/i.test(json.remark)
  ) {
    // Inspect the remark but never include its raw contents in logs.
    diag("http200_remark_runtime_error", {
      httpStatus: res.status,
      elements: elements.length,
      remarkPresent: true,
    });

    throw new DiscoverError(
      "OVERPASS_TIMEOUT",
      "The OpenStreetMap data service could not finish the query. Try again, or use a smaller radius.",
      504,
      true,
    );
  }

  logDiag("overpass", "ok", {
    httpStatus: res.status,
    ms: ms(),
    elements: elements.length,
    upstreamHost,
  });

  return {
    elements,
    limitReached: elements.length >= cfg.overpassElementLimit,
  };
}
