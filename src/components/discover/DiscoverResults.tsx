"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ResultsWorkspace } from "@/components/discover/ResultsWorkspace";
import { DEFAULT_RADIUS, RADII } from "@/lib/config";
import type { DiscoverFailure, DiscoverResponse, DiscoverSuccess } from "@/types/discover";
import type { RadiusKm } from "@/types/pinventa";

const CLIENT_TIMEOUT_MS = 60_000;

type Outcome =
  | { key: string; kind: "data"; data: DiscoverSuccess }
  | { key: string; kind: "error"; error: DiscoverFailure["error"] };

const GENERIC_ERROR: DiscoverFailure["error"] = {
  code: "INTERNAL",
  message: "The search could not reach the Pinventa server. Check your connection and try again.",
  retryable: true,
};

/**
 * Runs the search for the current URL (`location`, `radius`, `industry`) against
 * POST /api/discover and renders only what the API returns. Loading is derived
 * (no stored outcome for the current key); there is no sample-data fallback.
 */
export function DiscoverResults() {
  const params = useSearchParams();
  const location = params.get("location")?.trim() ?? "";
  const radiusRaw = params.get("radius") ?? "";
  const industryId = params.get("industry") ?? "";
  const [attempt, setAttempt] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const key = `${location}|${radiusRaw}|${industryId}|${attempt}`;

  useEffect(() => {
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(CLIENT_TIMEOUT_MS)]);

    fetch("/api/discover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location, radiusKm: Number(radiusRaw), industry: industryId }),
      signal,
    })
      .then(async (res): Promise<Outcome> => {
        let body: DiscoverResponse | null = null;
        try {
          body = (await res.json()) as DiscoverResponse;
        } catch {
          body = null;
        }
        if (body?.ok) return { key, kind: "data", data: body };
        return { key, kind: "error", error: body && !body.ok ? body.error : GENERIC_ERROR };
      })
      .catch((err: unknown): Outcome | null => {
        if (controller.signal.aborted) return null; // superseded or unmounted
        const timedOut = err instanceof Error && err.name === "TimeoutError";
        return {
          key,
          kind: "error",
          error: {
            ...GENERIC_ERROR,
            message: timedOut
              ? "The search is taking too long. Try again, or use a smaller radius."
              : GENERIC_ERROR.message,
          },
        };
      })
      .then((result) => {
        if (result) setOutcome(result);
      });

    return () => controller.abort();
  }, [key, location, radiusRaw, industryId]);

  const radiusNum = Number(radiusRaw);
  const radiusKm: RadiusKm = (RADII as number[]).includes(radiusNum)
    ? (radiusNum as RadiusKm)
    : DEFAULT_RADIUS;

  const editParams = new URLSearchParams({ location, radius: String(radiusKm), industry: industryId });
  const editHref = `/discover?${editParams.toString()}`;
  const query = { location: location || "Location not specified", radiusKm, industryId };
  const current = outcome?.key === key ? outcome : null;

  if (!current) {
    return <ResultsWorkspace state="loading" query={query} businesses={[]} editHref={editHref} />;
  }

  if (current.kind === "error") {
    return (
      <ResultsWorkspace
        state="error"
        query={query}
        businesses={[]}
        editHref={editHref}
        errorMessage={current.error.message}
        onRetry={current.error.retryable ? () => setAttempt((n) => n + 1) : undefined}
      />
    );
  }

  const { data } = current;
  return (
    <ResultsWorkspace
      state={data.businesses.length > 0 ? "data" : "empty"}
      query={{ location: data.query.location, radiusKm: data.query.radiusKm, industryId: data.query.industry }}
      businesses={data.businesses}
      center={data.center}
      meta={data.meta}
      editHref={editHref}
    />
  );
}
