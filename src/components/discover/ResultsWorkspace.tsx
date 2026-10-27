"use client";

import Link from "next/link";
import { useState } from "react";
import { BusinessResultRow } from "@/components/discover/BusinessResultRow";
import { LiveMap } from "@/components/discover/LiveMap";
import { MapCanvas } from "@/components/discover/MapCanvas";
import {
  EmptyResults,
  ErrorResults,
  LoadingResults,
} from "@/components/discover/ResultStates";
import { Icon } from "@/components/ui/Icon";
import { useLeadStore } from "@/context/LeadStoreContext";
import { INDUSTRIES } from "@/lib/config";
import type { DiscoverCenter, DiscoverMeta } from "@/types/discover";
import type { BusinessResult, SearchQuery, SearchViewState } from "@/types/pinventa";

interface ResultsWorkspaceProps {
  state: Exclude<SearchViewState, "idle">;
  query: SearchQuery;
  businesses: BusinessResult[];
  /** Search center from the API; required to draw the real map. */
  center?: DiscoverCenter;
  meta?: DiscoverMeta;
  /** Where "Edit search" goes (keeps the user's input). */
  editHref?: string;
  errorMessage?: string;
  onRetry?: () => void;
}

const NO_BUSINESSES: BusinessResult[] = [];

/** Split view: map on the left, summary strip and results on the right. */
export function ResultsWorkspace({
  state,
  query,
  businesses,
  center,
  meta,
  editHref = "/discover",
  errorMessage,
  onRetry,
}: ResultsWorkspaceProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const { hasLead, saveLead, unsaveLead } = useLeadStore();

  const industryLabel =
    INDUSTRIES.find((i) => i.id === query.industryId)?.label ?? "No industry selected";
  const showRealMap = center !== undefined && (state === "data" || state === "empty");

  function toggleSave(id: string) {
    const business = businesses.find((b) => b.id === id);
    if (!business) return;
    if (hasLead(id)) {
      unsaveLead(id);
    } else {
      saveLead(business);
    }
  }

  function focusBusiness(id: string) {
    setActiveId(id);
    document
      .getElementById(`business-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  return (
    <div className="grid flex-1 grid-cols-1 lg:grid-cols-12">
      <div className="border-line h-[420px] lg:col-span-5 lg:h-[calc(100vh-56px)] lg:sticky lg:top-14 lg:self-start lg:border-r">
        {showRealMap ? (
          <LiveMap
            center={center}
            radiusKm={query.radiusKm}
            businesses={state === "data" ? businesses : NO_BUSINESSES}
            activeId={activeId}
            onSelect={focusBusiness}
          />
        ) : (
          <MapCanvas />
        )}
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
              {state === "data" ? `${businesses.length} results` : state === "empty" ? "0 results" : "—"}
            </span>
            <Link
              href={editHref}
              className="inline-flex h-7 items-center gap-1 rounded border border-line bg-card px-2.5 text-[12px] font-semibold hover:border-primary hover:bg-stone"
            >
              Edit search
            </Link>
          </div>
        </div>

        {(state === "data" || state === "empty") && meta && (
          <div className="border-b border-line bg-stone px-6 py-2 text-[11px] leading-[16px] text-ink-2">
            Live data from OpenStreetMap contributors (Overpass). Details are shown only as
            listed in the source and are not verified.
            {meta.skippedUnnamed > 0 && ` ${meta.skippedUnnamed} unnamed ${meta.skippedUnnamed === 1 ? "object was" : "objects were"} skipped.`}
            {meta.duplicatesMerged > 0 && ` ${meta.duplicatesMerged} duplicate ${meta.duplicatesMerged === 1 ? "record was" : "records were"} merged.`}
            {meta.truncated && " Results were capped; narrow the radius or industry to see more."}
          </div>
        )}

        {state === "loading" && <LoadingResults />}
        {state === "empty" && <EmptyResults editHref={editHref} />}
        {state === "error" && (
          <ErrorResults editHref={editHref} onRetry={onRetry} message={errorMessage} />
        )}
        {state === "data" && (
          <div className="flex flex-col gap-4 p-6">
            {businesses.map((business, index) => (
              <BusinessResultRow
                key={business.id}
                business={business}
                index={index}
                active={business.id === activeId}
                saved={hasLead(business.id)}
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
