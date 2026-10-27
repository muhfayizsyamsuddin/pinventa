"use client";

import { useSearchParams } from "next/navigation";
import { SearchControls } from "@/components/discover/SearchControls";
import { RADII } from "@/lib/config";
import type { RadiusKm } from "@/types/pinventa";

/** Prefills the search form from the URL so "Edit search" keeps the user's input. */
export function DiscoverForm() {
  const params = useSearchParams();
  const radius = Number(params.get("radius"));
  const initial = {
    location: params.get("location") ?? "",
    radiusKm: (RADII as number[]).includes(radius) ? (radius as RadiusKm) : undefined,
    industryId: params.get("industry") ?? "",
  };
  return <SearchControls initial={initial} />;
}
