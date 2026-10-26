import type { Metadata } from "next";
import { LeadsSummary } from "@/components/leads/LeadsSummary";
import { LeadsWorkspace } from "@/components/leads/LeadsWorkspace";
import { DemoNotice, PageHeader } from "@/components/ui/Panel";
import { DEMO_LEADS } from "@/data/illustrative";

export const metadata: Metadata = { title: "Leads" };

export default function LeadsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <DemoNotice trailing={`${DEMO_LEADS.length} preview records`}>
        Illustrative preview — not live data. These are placeholder records,
        not database results; scores are not computed from real evidence.
      </DemoNotice>
      <div className="flex flex-col gap-5 px-6 py-6">
        <PageHeader
          title="Leads"
          description="Prospects under research and qualification review. Leads without a source-traceable work email stay as Needs Verification and are not counted as email-ready."
        />
        <LeadsSummary leads={DEMO_LEADS} />
        <LeadsWorkspace leads={DEMO_LEADS} />
      </div>
    </div>
  );
}
