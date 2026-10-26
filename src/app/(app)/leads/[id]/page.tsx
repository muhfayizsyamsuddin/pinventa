import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { HypothesisList, ObservedFacts } from "@/components/leads/LeadFacts";
import { ScoreBreakdown } from "@/components/leads/ScoreBreakdown";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { DemoNotice } from "@/components/ui/Panel";
import { DemoBadge, LeadStatusBadge } from "@/components/ui/StatusBadge";
import { DEMO_LEADS, findDemoLead } from "@/data/illustrative";

export function generateStaticParams() {
  return DEMO_LEADS.map((lead) => ({ id: lead.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/leads/[id]">): Promise<Metadata> {
  const { id } = await params;
  const lead = findDemoLead(id);
  return { title: lead ? `${lead.name} · Lead detail` : "Lead not found" };
}

export default function LeadDetailPage({ params }: PageProps<"/leads/[id]">) {
  return (
    <Suspense
      fallback={
        <p role="status" className="px-6 py-6 text-[12px] text-ink-2">
          Loading lead…
        </p>
      }
    >
      <LeadContent params={params} />
    </Suspense>
  );
}

async function LeadContent({ params }: Pick<PageProps<"/leads/[id]">, "params">) {
  const { id } = await params;
  const lead = findDemoLead(id);
  if (!lead) notFound();
  const isDemo = lead.dataOrigin === "demo";

  return (
    <div className="flex flex-1 flex-col">
      {isDemo && (
        <DemoNotice trailing={lead.refId}>
          Illustrative preview — not live data. This record is a placeholder; its
          score and hypotheses are not derived from any real business.
        </DemoNotice>
      )}
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-6 py-6">
        <div className="flex flex-col gap-3">
          <Link
            href="/leads"
            className="inline-flex w-fit items-center gap-1 text-[12px] text-ink-2 hover:text-primary"
          >
            <Icon name="arrow-left" size={14} />
            Back to leads
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[24px] font-medium leading-8 tracking-[-0.015em]">
                  {lead.name}
                </h1>
                {isDemo && <DemoBadge />}
                <LeadStatusBadge status={lead.status} />
              </div>
              <p className="text-[13px] text-ink-2">
                {lead.category} · {lead.area} ·{" "}
                <span className="font-mono text-[12px]">{lead.distanceKm.toFixed(1)} km from center</span>
              </p>
              <p className="text-[12px] text-ink-3">
                {lead.emailReady
                  ? "Email-ready: a source-traceable work email is on record."
                  : "Not email-ready: no verified work email on record. Kept as Needs Verification for outreach purposes."}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-7">
            <ObservedFacts facts={lead.facts} sourceLabel={lead.sourceLabel} />
            <HypothesisList hypotheses={lead.hypotheses} />
          </div>
          <div className="lg:col-span-5">
            <ScoreBreakdown components={lead.components} illustrative={isDemo} />
          </div>
        </div>

        <section
          aria-labelledby="outreach-cta"
          className="flex flex-col items-start justify-between gap-4 rounded-lg border border-line bg-card p-5 md:flex-row md:items-center"
        >
          <div className="max-w-2xl space-y-1">
            <p className="label-caps flex items-center gap-1.5 !text-primary">
              <Icon name="mail" size={14} />
              Outreach preparation
            </p>
            <h2 id="outreach-cta" className="text-[16px] font-semibold">
              Prepare a draft for {lead.name}
            </h2>
            <p className="text-[13px] leading-5 text-ink-2">
              Drafts are for human review only and are never sent from Pinventa.
            </p>
          </div>
          <ButtonLink href={`/outreach?lead=${lead.id}`} variant="primary" className="h-9 px-4">
            <Icon name="mail" size={15} />
            Open Outreach Studio
          </ButtonLink>
        </section>
      </div>
    </div>
  );
}
