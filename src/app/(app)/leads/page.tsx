import type { Metadata } from "next";
import { LeadsSummary } from "@/components/leads/LeadsSummary";
import { LeadsWorkspace } from "@/components/leads/LeadsWorkspace";
import { LiveLeadsSection } from "@/components/leads/LiveLeadsSection";
import { DemoNotice, PageHeader } from "@/components/ui/Panel";
import { DEMO_LEADS } from "@/data/illustrative";

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

        {/* Illustrative preview leads (strictly separated in closed disclosure) */}
        <details className="group rounded-lg border border-line bg-card/60 p-4 transition-colors">
          <summary className="flex cursor-pointer select-none items-center justify-between text-[14px] font-semibold tracking-tight text-ink-2 hover:text-ink">
            <span className="flex items-center gap-2">
              <span>Illustrative Sample Data (Demo Fixtures)</span>
              <span className="rounded bg-stone px-2 py-0.5 font-mono text-[11px] font-normal text-ink-3">
                {DEMO_LEADS.length} sample records
              </span>
            </span>
            <span className="text-[12px] font-normal text-ink-3 group-open:hidden">
              Show demo fixtures ▾
            </span>
            <span className="hidden text-[12px] font-normal text-ink-3 group-open:inline">
              Hide demo fixtures ▴
            </span>
          </summary>
          <div className="mt-4 flex flex-col gap-4 border-t border-line pt-4">
            <p className="text-[12px] text-ink-3">
              Synthetic records provided for UI layout and evaluation. Kept completely separate from
              live OpenStreetMap discoveries.
            </p>

            <DemoNotice trailing={`${DEMO_LEADS.length} preview records`}>
              Illustrative preview — not live data. These are placeholder records, not database results;
              scores are not computed from real evidence.
            </DemoNotice>

            <LeadsSummary leads={DEMO_LEADS} />
            <LeadsWorkspace leads={DEMO_LEADS} />
          </div>
        </details>
      </div>
    </div>
  );
}
