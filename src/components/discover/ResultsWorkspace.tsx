"use client";

import Link from "next/link";
import { useState } from "react";
import { BusinessResultRow } from "@/components/discover/BusinessResultRow";
import { MapCanvas } from "@/components/discover/MapCanvas";
import {
  EmptyResults,
  ErrorResults,
  LoadingResults,
} from "@/components/discover/ResultStates";
import { Icon } from "@/components/ui/Icon";
import { INDUSTRIES } from "@/lib/config";
import type { BusinessResult, SearchQuery, SearchViewState } from "@/types/pinventa";

interface ResultsWorkspaceProps {
  state: Exclude<SearchViewState, "idle">;
  query: SearchQuery;
  businesses: BusinessResult[];
}

/** Split view: map on the left, summary strip and results on the right. */
export function ResultsWorkspace({ state, query, businesses }: ResultsWorkspaceProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const industryLabel =
    INDUSTRIES.find((i) => i.id === query.industryId)?.label ?? "No industry selected";
  const showPins = state === "data";
  const showRadius = state !== "error";

  function toggleSave(id: string) {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function focusBusiness(id: string) {
    setActiveId(id);
    document
      .getElementById(`business-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="grid flex-1 grid-cols-1 lg:grid-cols-12">
      <div className="border-line lg:col-span-5 lg:border-r">
        <MapCanvas
          pins={showPins ? businesses : []}
          radiusKm={showRadius ? query.radiusKm : undefined}
          centerLabel={query.location}
          activeId={activeId}
          onPinSelect={focusBusiness}
        />
      </div>

      <div className="flex flex-col bg-canvas lg:col-span-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-sunken px-6 py-3">
          <div className="flex min-w-0 items-center gap-2 text-[12px] font-medium">
            <Icon name="map-pin" size={16} className="shrink-0 text-primary" />
            <span className="truncate">
              {query.location}
              <span className="mx-1.5 text-line-strong">•</span>
              {query.radiusKm} km radius
              <span className="mx-1.5 text-line-strong">•</span>
              <span className="font-normal text-ink-2">{industryLabel}</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[12px] text-ink-2" aria-live="polite">
              {state === "data" ? `${businesses.length} results` : "0 results"}
            </span>
            <Link
              href="/discover"
              className="inline-flex h-7 items-center gap-1 rounded border border-line bg-card px-2.5 text-[12px] font-semibold hover:border-primary hover:bg-stone"
            >
              Edit search
            </Link>
          </div>
        </div>

        {state === "loading" && <LoadingResults />}
        {state === "empty" && <EmptyResults editHref="/discover" />}
        {state === "error" && <ErrorResults editHref="/discover" />}
        {state === "data" && (
          <div className="flex flex-col gap-4 p-6">
            {businesses.map((business, index) => (
              <BusinessResultRow
                key={business.id}
                business={business}
                index={index}
                active={business.id === activeId}
                saved={savedIds.has(business.id)}
                onHover={setActiveId}
                onToggleSave={toggleSave}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
