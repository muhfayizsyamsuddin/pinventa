"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HypothesisList, ObservedFacts } from "@/components/leads/LeadFacts";
import { ScoreBreakdown } from "@/components/leads/ScoreBreakdown";
import { WorkflowStatusSelect } from "@/components/leads/WorkflowStatusSelect";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Panel, StateMessage } from "@/components/ui/Panel";
import { LeadStatusBadge, ProvenanceBadge } from "@/components/ui/StatusBadge";
import { useLeadStore } from "@/context/LeadStoreContext";
import { evaluateLeadReviewReadiness, setLastScoredLeadId } from "@/lib/lead-store";
import { saveDraftsForLead } from "@/lib/outreach-generator";
import {
  canTransitionLeadStatus,
  getLeadStatusLabel,
} from "@/lib/lead-status";

import type { LeadStatus } from "@/types/pinventa";

export function LiveLeadDetail({ id }: { id: string }) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const router = useRouter();
  const { getLeadById, isHydrated, unsaveLead, updateLead } = useLeadStore();
  const lead = getLeadById(id);

  const [isScoring, setIsScoring] = useState(false);
  const [scoringError, setScoringError] = useState<string | null>(null);

  if (!isHydrated) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-20 text-[13px] text-ink-2">
        <Icon name="search" size={20} className="mb-2 animate-spin text-primary" />
        Loading saved lead…
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
            icon="table"
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
            This lead (ID: <span className="font-mono text-ink">{id}</span>) is not in this browser&apos;s
            saved lead storage. It may have been removed, or was saved in a different browser session.
          </StateMessage>
        </div>
      </div>
    );
  }

  function handleStatusChange(next: LeadStatus) {
    if (!lead) return;
    if (next === "approved_for_outreach" && !lead.emailReady) {
      setStatusMessage(
        "Cannot approve for outreach: a verified work email is required.",
      );
      return;
    }

    if (!canTransitionLeadStatus(lead.status, next)) {
      setStatusMessage("This status transition is not allowed.");
      return;
    }

    updateLead(lead.id, { status: next });
    setStatusMessage(
      `Lead status updated to ${getLeadStatusLabel(next)}.`,
    );
  }


  const readiness = evaluateLeadReviewReadiness(lead);

  async function handleScore() {
    if (!lead) return;
    setIsScoring(true);
    setScoringError(null);
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const errorMsg = data.instructions
          ? `${data.error} ${data.instructions}`
          : data.error || "Scoring request failed.";
        setScoringError(errorMsg);
        return;
      }

      // Update lead in store
      updateLead(lead.id, {
        components: data.components,
        scoredAt: data.scoredAt,
        scoringModel: data.scoringModel,
        scoringProvider: data.scoringProvider,
        hypotheses: data.hypotheses && data.hypotheses.length > 0 ? data.hypotheses : lead.hypotheses,
      });

      setLastScoredLeadId(lead.id);

      if (data.drafts && Array.isArray(data.drafts) && data.drafts.length > 0) {
        saveDraftsForLead(lead.id, data.drafts);
      }

      if (data.n8n?.triggered) {
        const count = data.drafts?.length ?? 0;
        setStatusMessage(
          count > 0
            ? `Score generated & ${count} outreach drafts created via n8n.`
            : "Score generated and n8n workflow triggered successfully."
        );
      } else if (data.n8n?.error && !data.n8n?.error.includes("not configured")) {
        setStatusMessage(`Score generated (n8n notice: ${data.n8n.error})`);
      } else {
        setStatusMessage("Lead scored successfully.");
      }
    } catch (err: unknown) {
      setScoringError(err instanceof Error ? err.message : "Network error during scoring.");
    } finally {
      setIsScoring(false);
    }
  }

  function handleUnsave() {
    if (!lead) return;
    unsaveLead(lead.id);
    router.push("/leads");
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-line bg-stone px-6 py-2.5 text-[12px] text-ink-2">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-sage" />
            Live business record saved from OpenStreetMap (Overpass API)
          </span>
          <span className="font-mono text-[11px] text-ink-3">Ref: {lead.refId}</span>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-6 py-6">
        <div className="flex flex-col gap-3">
          <Link
            href="/leads"
            className="inline-flex w-fit items-center gap-1 text-[12px] text-ink-2 hover:text-primary"
          >
            <Icon name="arrow-left" size={14} />
            Back to leads
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[24px] font-medium leading-8 tracking-[-0.015em]">
                  {lead.name}
                </h1>
                <ProvenanceBadge label="Live · OSM" />
                <LeadStatusBadge status={lead.status} />
                {readiness.checks.isBuildingOrFacility && (
                  <span className="inline-flex items-center gap-1 rounded bg-amber-soft px-2 py-0.5 text-[11px] font-semibold text-amber border border-amber/30">
                    ⚠ Identity needs review
                  </span>
                )}
              </div>
              <p className="text-[13px] text-ink-2">
                {lead.category} · {lead.area} ·{" "}
                <span className="font-mono text-[12px]">
                  {lead.distanceKm.toFixed(1)} km from search center
                </span>
              </p>
              <p className="text-[12px] text-ink-3">
                {lead.emailReady
                  ? "Email-ready: a source-traceable work email is on record."
                  : "Needs Verification: contact info listed in OSM requires independent verification before sales outreach."}
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-2.5">
              <Button
                variant={lead.components.length === 0 ? "primary" : "secondary"}
                className="h-8 px-3 text-[12px]"
                onClick={handleScore}
                disabled={isScoring}
              >
                <Icon
                  name={isScoring ? "loader" : lead.components.length === 0 ? "layers" : "reset"}
                  size={13}
                  className={isScoring ? "animate-spin" : ""}
                />
                {isScoring ? "Scoring…" : lead.components.length === 0 ? "Score with AI" : "Re-score"}
              </Button>


              <WorkflowStatusSelect
                id="live-lead-workflow-status"
                variant="detail"
                status={lead.status}
                emailReady={lead.emailReady}
                onChange={handleStatusChange}
                ariaLabel={`Change workflow status for ${lead.name}`}
              />


              <Button
                variant="secondary"
                className="h-8 px-3 text-[12px] text-danger hover:border-danger hover:bg-danger-soft"
                onClick={handleUnsave}
              >
                <Icon name="dash-circle" size={13} />
                Remove from saved
              </Button>
            </div>
          </div>
        </div>

        {statusMessage && (
          <p role="status" className="text-[12px] text-sage">
            {statusMessage}
          </p>
        )}

        {lead.statusUpdatedAt && (
          <p className="text-[11px] text-ink-3">
            Status last updated:{" "}
            {new Date(lead.statusUpdatedAt).toLocaleString("id-ID")}
          </p>
        )}

        {lead.status === "approved_for_outreach" && !lead.emailReady && (
          <p className="rounded border border-amber/30 bg-amber-soft p-3 text-[12px] leading-5 text-amber">
            This lead is marked Approved for Outreach, but no independently
            verified work email is recorded. The lead is not email-ready.
            Verify the contact before external outreach.
          </p>
        )}


        {/* Flag warning if entity appears to be a physical building or property centre */}
        {readiness.checks.isBuildingOrFacility && (
          <div className="rounded-lg border border-amber/30 bg-amber-soft p-4 text-[13px] leading-5 text-amber">
            <div className="flex items-center gap-2 font-semibold">
              <Icon name="dash-circle" size={16} />
              Business identity needs clarification
            </div>
            <p className="mt-1 text-[12px] text-ink-2">
              The source name for <strong className="text-ink">{lead.name}</strong> resembles a physical building or property centre, while its OSM category ({lead.category || "not listed"}) is generic or missing.
              This is a review flag, not proof that the record is a building. Confirm the operating company or tenant before treating it as a sales prospect.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-7">
            <ObservedFacts facts={lead.facts} sourceLabel={lead.sourceLabel} />

            {lead.hypotheses && lead.hypotheses.length > 0 ? (
              <HypothesisList hypotheses={lead.hypotheses} />
            ) : (
              <Panel
                title="Potential opportunities"
                icon="lightbulb"
                meta="AI Agent — Milestone 3"
              >
                <div className="flex flex-col gap-3 p-4">
                  <p className="rounded border border-line bg-sunken p-3 text-[12px] leading-[18px] text-ink-2">
                    <strong className="font-semibold text-ink">Analytical note:</strong>{" "}
                    Analytical hypotheses will be synthesized by the AI Agent pipeline (n8n + OpenRouter)
                    in Milestone 3. Pinventa does not fabricate assumptions or business challenges from raw
                    map metadata alone.
                  </p>
                  <div className="rounded-lg border border-dashed border-line bg-stone p-4 text-center">
                    <p className="text-[12px] font-medium text-ink-2">
                      No automated hypotheses yet for this live lead.
                    </p>
                    <p className="mt-1 text-[11px] text-ink-3">
                      Click &quot;Score with AI&quot; to synthesize grounded hypotheses, or use observed facts to compose a draft manually.
                    </p>
                  </div>
                </div>
              </Panel>
            )}
          </div>

          <div className="flex flex-col gap-6 lg:col-span-5">
            {/* Criterion 4 Review Readiness Card */}
            <Panel
              title="Review readiness"
              icon="shield-check"
              meta={readiness.isReviewReady ? "Review-ready" : "Needs Review"}
            >
              <div className="flex flex-col gap-3 p-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider ${readiness.isReviewReady
                      ? "border border-sage/30 bg-sage-soft text-sage"
                      : "border border-amber/30 bg-amber-soft text-amber"
                      }`}
                  >
                    {readiness.isReviewReady
                      ? "✓ Meets Review Completeness Rules"
                      : "⚠ Held for Human Review"}
                  </span>
                </div>

                <ul className="flex flex-col gap-2 text-[12px]">
                  <li className="flex items-start justify-between gap-2 border-b border-line pb-1.5">
                    <span className="text-ink-2">Business identity</span>
                    <span
                      className={
                        readiness.checks.isBuildingOrFacility
                          ? "font-medium text-amber"
                          : "font-medium text-sage"
                      }
                    >
                      {readiness.checks.isBuildingOrFacility
                        ? "Business identity needs confirmation"
                        : "No ambiguity detected"}
                    </span>
                  </li>
                  <li className="flex items-start justify-between gap-2 border-b border-line pb-1.5">
                    <span className="text-ink-2">Commercial category</span>
                    <span
                      className={
                        readiness.checks.hasCategory
                          ? "font-medium text-sage"
                          : "font-medium text-amber"
                      }
                    >
                      {readiness.checks.hasCategory ? lead.category : "Missing"}
                    </span>
                  </li>
                  <li className="flex items-start justify-between gap-2 border-b border-line pb-1.5">
                    <span className="text-ink-2">Location completeness</span>
                    <span
                      className={
                        readiness.checks.hasLocation
                          ? "font-medium text-sage"
                          : "font-medium text-amber"
                      }
                    >
                      {readiness.checks.hasLocation ? "Address / Coordinates listed" : "Missing"}
                    </span>
                  </li>
                  <li className="flex items-start justify-between gap-2 border-b border-line pb-1.5">
                    <span className="text-ink-2">Traceable OSM source</span>
                    <span
                      className={
                        readiness.checks.hasTraceableSource
                          ? "font-medium text-sage"
                          : "font-medium text-amber"
                      }
                    >
                      {readiness.checks.hasTraceableSource ? "Verified reference" : "Missing"}
                    </span>
                  </li>
                  <li className="flex items-start justify-between gap-2">
                    <span className="text-ink-2">Recorded digital presence</span>
                    <span
                      className={
                        readiness.checks.hasDigitalPresence
                          ? "font-medium text-sage"
                          : "font-medium text-amber"
                      }
                    >
                      {readiness.checks.hasDigitalPresence
                        ? "Website / Phone in OSM"
                        : "None listed in source"}
                    </span>
                  </li>
                </ul>

                <p className="mt-1 text-[11px] leading-4 text-ink-3">
                  Note: Contact presence reflects data listed in OpenStreetMap contributors&apos; records, not an independent verification of deliverability or business registration.
                </p>
              </div>
            </Panel>

            <ScoreBreakdown
              components={lead.components}
              onScore={handleScore}
              isScoring={isScoring}
              error={scoringError}
              scoringModel={lead.scoringModel}
              scoringProvider={lead.scoringProvider}
              scoredAt={lead.scoredAt}
            />
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
