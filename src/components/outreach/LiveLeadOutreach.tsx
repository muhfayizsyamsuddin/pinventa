"use client";

import Link from "next/link";
import { OutreachStudio } from "@/components/outreach/OutreachStudio";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHeader, StateMessage } from "@/components/ui/Panel";
import { LeadStatusBadge, ProvenanceBadge } from "@/components/ui/StatusBadge";
import { useLeadStore } from "@/context/LeadStoreContext";
import { getOrInitDraftsForLead } from "@/lib/outreach-generator";

export function LiveLeadOutreach({ leadId }: { leadId: string }) {
  const { getLeadById, isHydrated } = useLeadStore();
  const lead = getLeadById(leadId);

  if (!isHydrated) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-20 text-[13px] text-ink-2">
        <Icon name="search" size={20} className="mb-2 animate-spin text-primary" />
        Loading saved lead context…
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="mx-auto flex w-full max-w-[800px] flex-col gap-4 px-6 py-12">
        <Link
          href="/leads"
          className="inline-flex w-fit items-center gap-1 text-[12px] text-ink-2 hover:text-primary"
        >
          <Icon name="arrow-left" size={14} />
          Back to leads
        </Link>
        <div className="rounded-lg border border-line bg-card p-6">
          <StateMessage
            icon="mail"
            title="Live lead not found"
            action={
              <div className="flex gap-2">
                <ButtonLink href="/leads" variant="secondary" className="text-[12px]">
                  View saved leads
                </ButtonLink>
                <ButtonLink href="/discover" variant="primary" className="text-[12px]">
                  Go to Discover
                </ButtonLink>
              </div>
            }
          >
            The lead with ID <span className="font-mono text-ink">{leadId}</span> was not found in saved
            leads storage. It may have been removed or saved in a different browser session.
          </StateMessage>
        </div>
      </div>
    );
  }

  const drafts = getOrInitDraftsForLead(lead);

  return (
    <div className="flex flex-1 flex-col">
      {/* Live context bar (replaces DemoNotice) */}
      <div className="border-b border-line bg-stone px-6 py-2.5 text-[12px] text-ink-2">
        <div className="mx-auto flex max-w-[1360px] items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-sage" />
            Live lead context: <strong className="text-ink">{lead.name}</strong> ({lead.category})
          </span>
          <span className="font-mono text-[11px] text-ink-3">Ref: {lead.refId}</span>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-5 px-6 py-6">
        <div className="flex flex-col gap-2">
          {/* Back button returns to the correct lead detail */}
          <Link
            href={`/leads/${lead.id}`}
            className="inline-flex w-fit items-center gap-1 text-[12px] text-ink-2 hover:text-primary"
          >
            <Icon name="arrow-left" size={14} />
            Back to lead detail ({lead.name})
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <PageHeader
              title="Outreach Studio"
              description="Draft personalized emails grounded in observed facts and clearly labeled hypotheses. Drafts are never sent from Pinventa."
            />
            <div className="flex items-center gap-2">
              <ProvenanceBadge label="Live · OSM" />
              <LeadStatusBadge status={lead.status} />
            </div>
          </div>
        </div>

        {/* Unified OutreachStudio editor interface */}
        <OutreachStudio key={lead.id} lead={lead} drafts={drafts} />
      </div>
    </div>
  );
}
