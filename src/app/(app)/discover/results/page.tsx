import type { Metadata } from "next";
import { Suspense } from "react";
import { DiscoverResults } from "@/components/discover/DiscoverResults";
import { LoadingResults } from "@/components/discover/ResultStates";

export const metadata: Metadata = { title: "Discover results" };

export default function DiscoverResultsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Suspense fallback={<LoadingResults />}>
        <DiscoverResults />
      </Suspense>
    </div>
  );
}
