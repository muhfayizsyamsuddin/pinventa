import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LiveLeadOutreach } from "@/components/outreach/LiveLeadOutreach";
import { OutreachStudio } from "@/components/outreach/OutreachStudio";
import { Icon } from "@/components/ui/Icon";
import { DemoNotice, PageHeader, Panel, StateMessage } from "@/components/ui/Panel";
import { DEMO_DRAFTS, DEMO_LEADS, findDemoLead } from "@/data/illustrative";

export const metadata: Metadata = { title: "Outreach" };

export default function OutreachPage({ searchParams }: PageProps<"/outreach">) {
  return (
    <Suspense
      fallback={
        <p role="status" className="px-6 py-6 text-[12px] text-ink-2">
          Loading drafts…
        </p>
      }
    >
      <OutreachContent searchParams={searchParams} />
    </Suspense>
  );
}

async function OutreachContent({
  searchParams,
}: Pick<PageProps<"/outreach">, "searchParams">) {
  const params = await searchParams;
  const leadParam = Array.isArray(params.lead) ? params.lead[0] : params.lead;
  const demoLead = leadParam ? findDemoLead(leadParam) : undefined;

  // If a lead is specified and it is not in demo fixtures, render live lead outreach
  if (leadParam && !demoLead) {
    return <LiveLeadOutreach leadId={leadParam} />;
  }

  const lead = demoLead ?? DEMO_LEADS[0];
  const drafts = DEMO_DRAFTS.filter((d) => d.leadId === lead.id);

  return (
    <div className="flex flex-1 flex-col">
      <DemoNotice trailing="PREVIEW MODE">
        Illustrative preview — not live data. These drafts are templates with
        placeholders, not generated from a live business record. Human review is
        required before any external communication.
      </DemoNotice>

      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-5 px-6 py-6">
        <div className="flex flex-col gap-2">
          <Link
            href={`/leads/${lead.id}`}
            className="inline-flex w-fit items-center gap-1 text-[12px] text-ink-2 hover:text-primary"
          >
            <Icon name="arrow-left" size={14} />
            Back to lead detail
          </Link>
          <PageHeader
            title="Outreach Studio"
            description="Draft personalized emails grounded in observed facts and clearly labeled hypotheses. Drafts are never sent from Pinventa."
          />
        </div>

        {drafts.length > 0 ? (
          <OutreachStudio key={lead.id} lead={lead} drafts={drafts} />
        ) : (
          <Panel>
            <StateMessage icon="mail" title={`No drafts for ${lead.name}`}>
              Drafts have not been prepared for this lead. In this preview only
              the first sample lead has template drafts.
            </StateMessage>
          </Panel>
        )}
      </div>
    </div>
  );
}
