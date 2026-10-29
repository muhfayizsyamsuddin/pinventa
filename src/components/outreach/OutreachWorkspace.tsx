"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LiveLeadOutreach } from "@/components/outreach/LiveLeadOutreach";
import { OutreachStudio } from "@/components/outreach/OutreachStudio";
import { Icon } from "@/components/ui/Icon";
import { DemoNotice, PageHeader, Panel, StateMessage } from "@/components/ui/Panel";
import { useLeadStore } from "@/context/LeadStoreContext";
import { DEMO_DRAFTS, DEMO_LEADS, findDemoLead } from "@/data/illustrative";
import { getLastScoredLeadId } from "@/lib/lead-store";

interface OutreachWorkspaceProps {
  initialLeadId?: string;
}

export function OutreachWorkspace({ initialLeadId }: OutreachWorkspaceProps) {
  const { leads, isHydrated, getLeadById } = useLeadStore();
  const [activeLeadId, setActiveLeadId] = useState<string | undefined>(initialLeadId);

  useEffect(() => {
    // 1. If explicit lead ID is provided in URL query, prioritize it
    if (initialLeadId) {
      setActiveLeadId(initialLeadId);
      return;
    }

    if (!isHydrated) return;

    // 2. Check if a lastScoredLeadId is stored in localStorage
    const lastScoredId = getLastScoredLeadId();

    if (lastScoredId && getLeadById(lastScoredId)) {
      setActiveLeadId(lastScoredId);
      return;
    }

    // 3. Otherwise find the most recently scored live lead
    const scoredLeads = leads
      .filter((l) => (l.scoredAt && l.scoredAt.length > 0) || l.components.length > 0)
      .sort((a, b) => {
        const timeA = a.scoredAt ? new Date(a.scoredAt).getTime() : 0;
        const timeB = b.scoredAt ? new Date(b.scoredAt).getTime() : 0;
        return timeB - timeA;
      });

    if (scoredLeads.length > 0) {
      setActiveLeadId(scoredLeads[0].id);
      return;
    }

    // 4. Fallback to the latest saved live lead
    if (leads.length > 0) {
      setActiveLeadId(leads[leads.length - 1].id);
    }
  }, [initialLeadId, isHydrated, leads, getLeadById]);

  // Loading state while hydrating store
  if (!isHydrated) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-20 text-[13px] text-ink-2">
        <Icon name="search" size={20} className="mb-2 animate-spin text-primary" />
        Loading outreach context…
      </div>
    );
  }

  // If a live lead is active (either requested or resolved from last scored), show live outreach
  if (activeLeadId && !findDemoLead(activeLeadId)) {
    return <LiveLeadOutreach leadId={activeLeadId} />;
  }

  // Fallback to demo template only if no live leads exist at all in user's session
  const demoLead = (activeLeadId ? findDemoLead(activeLeadId) : undefined) ?? DEMO_LEADS[0];
  const drafts = DEMO_DRAFTS.filter((d) => d.leadId === demoLead.id);

  return (
    <div className="flex flex-1 flex-col">
      <DemoNotice trailing="PREVIEW MODE">
        Illustrative preview — no live leads scored yet. Score a business from the Leads page to
        generate research-backed drafts via n8n.
      </DemoNotice>

      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-5 px-6 py-6">
        <div className="flex flex-col gap-2">
          <Link
            href="/leads"
            className="inline-flex w-fit items-center gap-1 text-[12px] text-ink-2 hover:text-primary"
          >
            <Icon name="arrow-left" size={14} />
            Go to saved leads
          </Link>
          <PageHeader
            title="Outreach Studio"
            description="Draft personalized emails grounded in observed facts and clearly labeled hypotheses. Drafts are never sent from Pinventa."
          />
        </div>

        {drafts.length > 0 ? (
          <OutreachStudio key={demoLead.id} lead={demoLead} drafts={drafts} />
        ) : (
          <Panel>
            <StateMessage icon="mail" title="No live leads scored yet">
              Please score a lead on the Leads page to automatically generate email drafts.
            </StateMessage>
          </Panel>
        )}
      </div>
    </div>
  );
}
