import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ResultsWorkspace } from "@/components/discover/ResultsWorkspace";
import { LoadingResults } from "@/components/discover/ResultStates";
import { DemoNotice } from "@/components/ui/Panel";
import { DEFAULT_RADIUS, INDUSTRIES, RADII } from "@/lib/config";
import { DEMO_BUSINESSES } from "@/data/illustrative";
import type { RadiusKm, SearchViewState } from "@/types/pinventa";

export const metadata: Metadata = { title: "Discover results" };

type PreviewState = Exclude<SearchViewState, "idle">;

const PREVIEW_STATES: { id: PreviewState; label: string }[] = [
  { id: "data", label: "Data" },
  { id: "loading", label: "Loading" },
  { id: "empty", label: "Empty" },
  { id: "error", label: "Error" },
];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function DiscoverResultsPage({
  searchParams,
}: PageProps<"/discover/results">) {
  return (
    <Suspense fallback={<LoadingResults />}>
      <ResultsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ResultsContent({
  searchParams,
}: Pick<PageProps<"/discover/results">, "searchParams">) {
  const params = await searchParams;

  const location = first(params.location)?.trim() || "Location not specified";
  const radiusParam = Number(first(params.radius));
  const radiusKm = (RADII as number[]).includes(radiusParam)
    ? (radiusParam as RadiusKm)
    : DEFAULT_RADIUS;
  const industryParam = first(params.industry) ?? "";
  const industryId = INDUSTRIES.some((i) => i.id === industryParam) ? industryParam : "";

  const stateParam = first(params.state);
  const state: PreviewState =
    PREVIEW_STATES.find((s) => s.id === stateParam)?.id ?? "data";

  const base = new URLSearchParams({
    location: first(params.location) ?? "",
    radius: String(radiusKm),
    industry: industryId,
  });

  return (
    <div className="flex flex-1 flex-col">
      <DemoNotice
        trailing={
          state === "data" ? `Sample scope: ${DEMO_BUSINESSES.length} records` : undefined
        }
      >
        Illustrative preview — not live data. The cards below are made-up
        placeholders; no search was run.
      </DemoNotice>

      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-stone px-6 py-2 text-[12px]">
        <span className="label-caps">Design review · preview state</span>
        <div className="flex gap-1" role="group" aria-label="Preview state">
          {PREVIEW_STATES.map((item) => {
            const qs = new URLSearchParams(base);
            qs.set("state", item.id);
            const active = item.id === state;
            return (
              <Link
                key={item.id}
                href={`/discover/results?${qs.toString()}`}
                aria-current={active ? "true" : undefined}
                className={`rounded border px-2.5 py-1 font-mono text-[11px] ${
                  active
                    ? "border-primary bg-card font-medium text-primary"
                    : "border-line bg-card text-ink-2 hover:border-primary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <ResultsWorkspace
        state={state}
        query={{ location, radiusKm, industryId }}
        businesses={DEMO_BUSINESSES}
      />
    </div>
  );
}
