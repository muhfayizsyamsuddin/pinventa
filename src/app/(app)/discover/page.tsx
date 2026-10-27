import type { Metadata } from "next";
import { Suspense } from "react";
import { IdleResults } from "@/components/discover/ResultStates";
import { MapCanvas } from "@/components/discover/MapCanvas";
import { DiscoverForm } from "@/components/discover/DiscoverForm";
import { SearchControls } from "@/components/discover/SearchControls";
import { Icon } from "@/components/ui/Icon";
import { PageHeader, Panel } from "@/components/ui/Panel";

export const metadata: Metadata = { title: "Discover" };

export default function DiscoverPage() {
  return (
    <div className="flex flex-1 flex-col gap-5 px-6 py-6">
      <PageHeader
        title="Discover businesses"
        description="Set a center point, radius, and industry. Results come from OpenStreetMap data when you search; nothing is searched until you submit."
      />

      <Suspense fallback={<SearchControls />}>
        <DiscoverForm />
      </Suspense>

      <div className="grid min-h-[480px] flex-1 grid-cols-1 gap-5 lg:grid-cols-12">
        <Panel
          title="Spatial canvas"
          icon="layers"
          meta="No boundary set"
          className="flex flex-col lg:col-span-6"
        >
          <div className="relative flex-1">
            <MapCanvas />
            <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
              <div className="flex max-w-xs flex-col items-center gap-2 rounded-lg border border-line bg-card p-5 text-center shadow-float">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sunken text-ink-3">
                  <Icon name="crosshair" size={18} />
                </div>
                <h2 className="text-[13px] font-semibold">No search executed</h2>
                <p className="text-[12px] leading-[18px] text-ink-2">
                  Enter a location and radius above to draw the search boundary.
                </p>
              </div>
            </div>
          </div>
        </Panel>

        <Panel
          title="Discovered businesses"
          icon="list"
          meta="0 results"
          className="flex flex-col lg:col-span-6"
        >
          <IdleResults />
        </Panel>
      </div>
    </div>
  );
}
