import type { Metadata } from "next";
import { LiveLeadsSection } from "@/components/leads/LiveLeadsSection";
import { PageHeader } from "@/components/ui/Panel";

export const metadata: Metadata = { title: "Leads" };

export default function LeadsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-8 px-6 py-6">
        <PageHeader
          title="Leads"
          description="Prospects under research and qualification review. Leads without a source-traceable work email stay as Needs Verification and are not counted as email-ready."
        />

        {/* Live leads from OpenStreetMap */}
        <LiveLeadsSection />

      </div>
    </div>
  );
}
