"use client";

import dynamic from "next/dynamic";

/** Leaflet touches `window`, so it is loaded client-side only. */
export const LiveMap = dynamic(() => import("@/components/discover/LeafletMap").then((m) => m.LeafletMap), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      aria-label="Loading map"
      className="flex h-full min-h-[420px] w-full items-center justify-center bg-sunken text-[12px] text-ink-3"
    >
      Loading map…
    </div>
  ),
});
