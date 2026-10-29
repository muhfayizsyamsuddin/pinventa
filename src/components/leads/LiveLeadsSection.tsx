"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { ExportCsvButton } from "@/components/leads/ExportCsvButton";
import { WorkflowStatusSelect } from "@/components/leads/WorkflowStatusSelect";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { LeadScore } from "@/components/ui/LeadScore";
import { StateMessage } from "@/components/ui/Panel";
import { LeadStatusBadge, ProvenanceBadge } from "@/components/ui/StatusBadge";
import { useLeadStore } from "@/context/LeadStoreContext";
import { evaluateLeadReviewReadiness, setLastScoredLeadId } from "@/lib/lead-store";
import { saveDraftsForLead } from "@/lib/outreach-generator";
import { priorityBand, totalScore } from "@/lib/scoring";
import {
  LEAD_STATUS_OPTIONS,
  canTransitionLeadStatus,
} from "@/lib/lead-status";

import type { FieldAvailability, LeadStatus } from "@/types/pinventa";

function Presence({
  label,
  value,
  icon,
}: {
  label: string;
  value: FieldAvailability;
  icon: "globe" | "phone";
}) {
  const listed = value === "listed";
  return (
    <span
      className={`flex items-center gap-1.5 text-[11px] ${listed ? "text-sage" : "text-ink-3"
        }`}
    >
      <Icon name={listed ? icon : "dash-circle"} size={13} />
      {label} {listed ? "listed" : "not listed"}
    </span>
  );
}

const TH = "label-caps px-3 py-2.5 text-left font-semibold";

type ContactReadinessFilter =
  | "all"
  | "email_ready"
  | "needs_verification";

type LivePriorityFilter =
  | "all"
  | "high"
  | "medium"
  | "low"
  | "unscored";

type LiveScoreFilter = "all" | "scored" | "unscored";

const SELECT =
  "h-7 cursor-pointer rounded border border-line bg-card px-2 text-[12px] font-medium text-ink focus:border-primary focus:outline-none";

export function LiveLeadsSection() {
  const { leads, isHydrated, unsaveLead, updateLead } = useLeadStore();
  const [query, setQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");

  const [priorityFilter, setPriorityFilter] =
    useState<LivePriorityFilter>("all");

  const [contactReadinessFilter, setContactReadinessFilter] =
    useState<ContactReadinessFilter>("all");
  const [workflowStatusFilter, setWorkflowStatusFilter] = useState<LeadStatus | "all">("all");
  const [scoreFilter, setScoreFilter] = useState<LiveScoreFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [scoringId, setScoringId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);

  async function handleScoreLead(lead: (typeof leads)[0]) {
    setScoringId(lead.id);
    setRowError(null);
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setRowError({
          id: lead.id,
          message: data.instructions ? `${data.error} ${data.instructions}` : data.error || "Scoring failed.",
        });
        return;
      }
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
    } catch (err: unknown) {
      setRowError({
        id: lead.id,
        message: err instanceof Error ? err.message : "Network error during scoring.",
      });
    } finally {
      setScoringId(null);
    }
  }

  // Evaluate each lead against Criterion 4 completeness and relevance rules
  const evaluatedLeads = useMemo(() => {
    return leads.map((lead) => ({
      lead,
      readiness: evaluateLeadReviewReadiness(lead),
    }));
  }, [leads]);

  const totalSavedCount = leads.length;
  const reviewReadyCount = evaluatedLeads.filter((item) => item.readiness.isReviewReady).length;
  // Keep this metric consistent with the Needs clarification filter: every lead
  // that fails the review-readiness rules requires further human review.
  const needsClarificationCount = evaluatedLeads.filter(
    (item) => !item.readiness.isReviewReady,
  ).length;
  const countWithWebsite = leads.filter((l) => l.website === "listed").length;
  const countWithPhone = leads.filter((l) => l.phone === "listed").length;
  const countWithContact = leads.filter(
    (l) => l.website === "listed" || l.phone === "listed" || l.email,
  ).length;
  const industries = useMemo(
    () =>
      Array.from(
        new Set(
          leads
            .map((lead) => lead.category.trim())
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [leads],
  );

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return evaluatedLeads.filter(({ lead }) => {
      if (
        workflowStatusFilter !== "all" &&
        lead.status !== workflowStatusFilter
      ) {
        return false;
      }
      // 1. Status Filter

      if (
        industryFilter !== "all" &&
        lead.category !== industryFilter
      ) {
        return false;
      }

      if (
        contactReadinessFilter === "email_ready" &&
        !lead.emailReady
      ) {
        return false;
      }

      if (
        contactReadinessFilter === "needs_verification" &&
        lead.emailReady
      ) {
        return false;
      }

      const hasScores =
        Array.isArray(lead.components) &&
        lead.components.length > 0;

      if (priorityFilter === "unscored" && hasScores) {
        return false;
      }

      if (
        priorityFilter !== "all" &&
        priorityFilter !== "unscored"
      ) {
        if (!hasScores) return false;

        if (priorityBand(totalScore(lead.components)) !== priorityFilter) {
          return false;
        }
      }
      if (scoreFilter === "scored" && !hasScores) {
        return false;
      }

      if (scoreFilter === "unscored" && hasScores) {
        return false;
      }

      // 3. Search query
      if (!q) return true;
      return [lead.name, lead.category, lead.subcategory, lead.refId, lead.area]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [
    evaluatedLeads,
    query,
    workflowStatusFilter,
    industryFilter,
    priorityFilter,
    contactReadinessFilter,
    scoreFilter,
  ]);

  const visibleLeads = useMemo(() => visibleItems.map((item) => item.lead), [visibleItems]);
  const exportable = visibleLeads.filter((l) => selectedIds.has(l.id));
  // If the user selected any rows, export only selected rows that still match
  // the active filters. Never fall back to exporting every visible row when the
  // selection exists but none of its rows match the current filters.
  const toExport = selectedIds.size > 0 ? exportable : visibleLeads;
  const visibleSelectedCount = exportable.length;

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds((prev) => {
      const allOn = visibleLeads.every((l) => prev.has(l.id));
      const next = new Set(prev);
      visibleLeads.forEach((l) => (allOn ? next.delete(l.id) : next.add(l.id)));
      return next;
    });
  }

  const allSelected =
    visibleLeads.length > 0 && visibleLeads.every((l) => selectedIds.has(l.id));

  if (!isHydrated) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-line bg-card text-[12px] text-ink-3">
        Loading saved leads…
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-4" aria-labelledby="live-leads-heading">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-card p-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="live-leads-heading" className="text-[18px] font-semibold tracking-tight">
              Live Saved Leads
            </h2>
            <ProvenanceBadge label="OpenStreetMap · Live" />

            {/* Criterion 4 Tracker: evaluates review-ready leads vs total saved */}
            {reviewReadyCount >= 5 ? (
              <span className="inline-flex items-center gap-1 rounded border border-sage/30 bg-sage-soft px-2.5 py-0.5 text-[11px] font-semibold text-sage">
                <Icon name="check" size={12} />
                Criterion 4 Met: {reviewReadyCount}/5 review-ready ({totalSavedCount} total saved)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded border border-amber/30 bg-amber-soft px-2.5 py-0.5 text-[11px] font-semibold text-amber">
                Criterion 4 Progress: {reviewReadyCount}/5 review-ready ({5 - reviewReadyCount} more needed) · {totalSavedCount} total saved
              </span>
            )}
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-2">
            Review-ready requires identifiable business details, a traceable OSM source, adequate
            location data, and at least one listed contact or digital channel. OSM contact details are
            not independently verified.
          </p>
          <details className="group mt-1.5 text-[11px]">
            <summary className="inline-flex cursor-pointer items-center gap-1 font-medium text-ink-2 hover:text-primary">
              <span>Review criteria</span>
              <Icon name="chevron-right" size={12} className="transition-transform group-open:rotate-90" />
            </summary>
            <div className="mt-2 rounded border border-line bg-stone/80 p-3 text-[11px] leading-relaxed text-ink-2 space-y-1">
              <p>
                <strong className="text-ink">Business identity:</strong> A building-like name (e.g. &quot;Centre&quot;, &quot;Tower&quot;) is flagged only when the OSM category is generic, facility-related, or missing. A name alone is not enough to classify a record as a building.
              </p>
              <p>
                <strong className="text-ink">Completeness:</strong> Identified commercial category, inspectable OSM link, location details, and at least one listed contact or digital channel.
              </p>
              <p className="text-ink-3">
                <strong className="text-ink">Provenance:</strong> Contact details in OpenStreetMap reflect source listings and are not independently verified.
              </p>
            </div>
          </details>
        </div>

        <ButtonLink href="/discover" variant="secondary" className="h-8 px-3 text-[12px] shrink-0 self-start">
          <Icon name="search" size={13} />
          Discover more businesses
        </ButtonLink>
      </div>

      {leads.length > 0 ? (
        <>
          {/* Two distinct metrics: Total saved vs Review-ready */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex flex-col justify-between rounded-lg border border-line bg-card p-3">
              <span className="label-caps">Total live saved</span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-[20px] font-medium leading-7">{totalSavedCount}</span>
                <span className="font-mono text-[11px] text-ink-3">saved records</span>
              </div>
              <p className="mt-1 text-[11px] text-ink-3">All saved in browser storage</p>
            </div>

            <div className="flex flex-col justify-between rounded-lg border border-line bg-card p-3">
              <div className="flex items-center justify-between">
                <span className="label-caps !text-sage">Review-ready (Criterion 4)</span>
                <span className="font-mono text-[10px] text-sage">5 required</span>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-[20px] font-medium leading-7 text-sage">
                  {reviewReadyCount}
                </span>
                <span className="font-mono text-[11px] text-ink-3">/ 5 target</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full bg-sage"
                  style={{ width: `${Math.min(100, (reviewReadyCount / 5) * 100)}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-lg border border-line bg-card p-3">
              <div className="flex items-center justify-between">
                <span className="label-caps !text-amber">Needs Clarification</span>
                <span className="font-mono text-[10px] text-amber">Manual review</span>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-[20px] font-medium leading-7 text-amber">
                  {needsClarificationCount}
                </span>
                <span className="font-mono text-[11px] text-ink-3">
                  {needsClarificationCount === 1 ? "record needs review" : "records need review"}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-ink-3">Fails one or more review-readiness checks</p>
            </div>

            <div className="flex flex-col justify-between rounded-lg border border-line bg-card p-3">
              <span className="label-caps">With Digital Presence</span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-[20px] font-medium leading-7">{countWithContact}</span>
                <span className="font-mono text-[11px] text-ink-3">/ {totalSavedCount}</span>
              </div>
              <p className="mt-1 text-[11px] text-ink-3">
                {countWithWebsite} web · {countWithPhone} phone (OSM source)
              </p>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col gap-3 rounded-lg border border-line bg-card p-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Icon
                  name="search"
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter saved live leads by name, category, or ref…"
                  aria-label="Filter live leads"
                  className="h-9 w-full rounded-md border border-line bg-card pl-9 pr-3 text-[13px] placeholder:text-ink-3 focus:border-primary focus:outline-none"
                />
              </div>

              <ExportCsvButton leads={toExport} scopeLabel="live-leads" />
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-3">
              <span className="label-caps">Filters</span>

              <label className="flex items-center gap-1.5 text-[12px] text-ink-2">
                Industry
                <select
                  className={SELECT}
                  value={industryFilter}
                  onChange={(event) => setIndustryFilter(event.target.value)}
                  aria-label="Filter by industry"
                >
                  <option value="all">All industries</option>
                  {industries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-1.5 text-[12px] text-ink-2">
                Priority
                <select
                  className={SELECT}
                  value={priorityFilter}
                  onChange={(event) =>
                    setPriorityFilter(event.target.value as LivePriorityFilter)
                  }
                  aria-label="Filter by lead priority"
                >
                  <option value="all">All priorities</option>
                  <option value="high">High (80–100)</option>
                  <option value="medium">Medium (60–79)</option>
                  <option value="low">Low (0–59)</option>
                  <option value="unscored">Unscored</option>
                </select>
              </label>

              <label className="flex items-center gap-1.5 text-[12px] text-ink-2">
                Contact readiness
                <select
                  className={SELECT}
                  value={contactReadinessFilter}
                  onChange={(event) =>
                    setContactReadinessFilter(
                      event.target.value as ContactReadinessFilter,
                    )
                  }
                  aria-label="Filter by contact readiness"
                >
                  <option value="all">All contacts</option>
                  <option value="email_ready">Email-ready</option>
                  <option value="needs_verification">Needs Verification</option>
                </select>
              </label>

              <label className="flex items-center gap-1.5 text-[12px] text-ink-2">
                Workflow status
                <select
                  className={SELECT}
                  value={workflowStatusFilter}
                  onChange={(event) =>
                    setWorkflowStatusFilter(
                      event.target.value as LeadStatus | "all",
                    )
                  }
                  aria-label="Filter leads by workflow status"
                >
                  <option value="all">All statuses</option>
                  {LEAD_STATUS_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-1.5 text-[12px] text-ink-2">
                Score
                <select
                  className={SELECT}
                  value={scoreFilter}
                  onChange={(e) => setScoreFilter(e.target.value as LiveScoreFilter)}
                  aria-label="Filter live leads by score"
                >
                  <option value="all">All</option>
                  <option value="scored">Scored</option>
                  <option value="unscored">Unscored</option>
                </select>
              </label>

              <span className="ml-auto font-mono text-[11px] text-ink-3" aria-live="polite">
                Showing {visibleItems.length} of {totalSavedCount} live records
                {visibleSelectedCount > 0 && ` · ${visibleSelectedCount} selected`}
              </span>
            </div>
          </div>

          {/* Leads Table */}
          <div className="overflow-hidden rounded-lg border border-line bg-card">
            {visibleItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-line bg-stone">
                      <th scope="col" className="w-10 px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleAll}
                          aria-label="Select all visible live leads"
                          className="h-3.5 w-3.5 accent-primary"
                        />
                      </th>
                      <th scope="col" className={TH}>Lead</th>
                      <th scope="col" className={TH}>Category</th>
                      <th scope="col" className={TH}>Location</th>
                      <th scope="col" className={TH}>Digital presence</th>
                      <th scope="col" className={TH}>Source</th>
                      <th scope="col" className={`${TH} text-right`}>Score</th>
                      <th scope="col" className={TH}>Review Status</th>
                      <th scope="col" className={`${TH} text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {visibleItems.map(({ lead, readiness }) => {
                      const selected = selectedIds.has(lead.id);
                      return (
                        <Fragment key={lead.id}>
                          <tr
                            className={`group transition-colors hover:bg-stone ${selected ? "bg-canvas shadow-[inset_2px_0_0_var(--color-primary)]" : ""
                              }`}
                          >
                            <td className="px-3 py-3 align-top">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => toggle(lead.id)}
                                aria-label={`Select ${lead.name}`}
                                className="mt-1 h-3.5 w-3.5 accent-primary"
                              />
                            </td>
                            <td className="px-3 py-3 align-top">
                              <div className="flex flex-col gap-1">
                                <Link
                                  href={`/leads/${lead.id}`}
                                  className="text-[13px] font-semibold text-ink hover:text-primary"
                                >
                                  {lead.name}
                                </Link>
                                {readiness.checks.isBuildingOrFacility && (
                                  <span
                                    className="inline-flex w-fit items-center gap-1 rounded bg-amber-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-amber border border-amber/30"
                                    title={readiness.reasons.join(". ")}
                                  >
                                    ⚠ Identity needs review
                                  </span>
                                )}
                                <span className="font-mono text-[11px] text-ink-3">{lead.refId}</span>
                              </div>
                            </td>
                            <td className="px-3 py-3 align-top">
                              <p className="text-[13px] font-medium">{lead.category}</p>
                            </td>
                            <td className="px-3 py-3 align-top">
                              <p className="text-[13px]">{lead.area}</p>
                              <p className="tnum font-mono text-[11px] text-ink-3">
                                {lead.distanceKm.toFixed(1)} km from center
                              </p>
                            </td>
                            <td className="px-3 py-3 align-top">
                              <div className="flex flex-col gap-1">
                                <Presence label="Website" value={lead.website} icon="globe" />
                                <Presence label="Phone" value={lead.phone} icon="phone" />
                              </div>
                            </td>
                            <td className="px-3 py-3 align-top">
                              {lead.osmUrl ? (
                                <a
                                  href={lead.osmUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 font-mono text-[11px] text-primary-press hover:underline"
                                >
                                  OSM record ↗
                                </a>
                              ) : (
                                <span className="font-mono text-[11px] text-ink-3">OSM</span>
                              )}
                            </td>
                            <td className="px-3 py-3 align-top text-right">
                              <div className="flex flex-col items-end gap-1.5">
                                <LeadScore
                                  total={totalScore(lead.components)}
                                  illustrative={false}
                                  unscored={lead.components.length === 0}
                                  showBand={lead.components.length > 0}
                                />
                                {lead.components.length === 0 ? (
                                  <Button
                                    variant="primary"
                                    className="h-6 px-2 text-[11px]"
                                    onClick={() => handleScoreLead(lead)}
                                    disabled={scoringId === lead.id}
                                    title="Run AI Qualification Scoring"
                                  >
                                    <Icon
                                      name={scoringId === lead.id ? "loader" : "layers"}
                                      size={11}
                                      className={scoringId === lead.id ? "animate-spin" : ""}
                                    />
                                    {scoringId === lead.id ? "Scoring…" : "Score"}
                                  </Button>
                                ) : (
                                  <button
                                    type="button"
                                    className="text-[10px] text-ink-3 hover:text-primary hover:underline"
                                    onClick={() => handleScoreLead(lead)}
                                    disabled={scoringId === lead.id}
                                    title="Re-run AI Qualification Scoring"
                                  >
                                    {scoringId === lead.id ? "Scoring…" : "Re-score"}
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-3 align-top">
                              <div className="flex flex-col items-start gap-1">
                                <LeadStatusBadge status={lead.status} />

                                <WorkflowStatusSelect
                                  variant="table"
                                  status={lead.status}
                                  emailReady={lead.emailReady}
                                  ariaLabel={`Change workflow status for ${lead.name}`}
                                  onChange={(next) => {
                                    if (canTransitionLeadStatus(lead.status, next)) {
                                      updateLead(lead.id, { status: next });
                                    }
                                  }}
                                />

                                {lead.status === "approved_for_outreach" && !lead.emailReady && (
                                  <span
                                    className="max-w-[180px] text-[10px] leading-4 text-amber"
                                    title="Contact information has not been independently verified."
                                  >
                                    Contact not verified — not email-ready
                                  </span>
                                )}

                                {readiness.isReviewReady ? (
                                  <span className="inline-flex items-center gap-1 font-mono text-[10px] text-sage">
                                    ✓ Review-ready
                                  </span>
                                ) : readiness.checks.isBuildingOrFacility ? (
                                  <span
                                    className="inline-flex items-center gap-1 font-mono text-[10px] text-amber cursor-help"
                                    title={readiness.reasons.join(". ")}
                                  >
                                    ⚠ Check relevance
                                  </span>
                                ) : (
                                  <span
                                    className="inline-flex items-center gap-1 font-mono text-[10px] text-ink-3 cursor-help"
                                    title={readiness.reasons.join(". ")}
                                  >
                                    Data incomplete
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-3 align-top">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link
                                  href={`/leads/${lead.id}`}
                                  className="rounded px-2 py-1 text-[12px] font-semibold text-primary hover:bg-sunken"
                                >
                                  Inspect
                                </Link>
                                <Link
                                  href={`/outreach?lead=${lead.id}`}
                                  className="inline-flex items-center gap-1 rounded border border-line bg-card px-2 py-1 text-[12px] font-medium hover:border-primary hover:bg-stone"
                                >
                                  <Icon name="mail" size={13} className="text-primary" />
                                  Outreach
                                </Link>
                                <Button
                                  variant="secondary"
                                  className="h-6 px-1.5 text-[11px] text-ink-3 hover:text-danger"
                                  onClick={() => unsaveLead(lead.id)}
                                  title="Remove from saved leads"
                                >
                                  Remove
                                </Button>
                              </div>
                            </td>
                          </tr>
                          {rowError?.id === lead.id && (
                            <tr key={`err-${lead.id}`} className="bg-danger-soft/60">
                              <td colSpan={9} className="px-3 py-2 text-[12px] text-danger border-b border-danger/20">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <Icon name="alert" size={14} className="shrink-0" />
                                    <span>{rowError.message}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setRowError(null)}
                                    className="text-[11px] underline text-ink-2 hover:text-ink shrink-0"
                                  >
                                    Dismiss
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <StateMessage
                icon="search"
                title="No saved leads match your filter"
                action={
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setQuery("");
                      setIndustryFilter("all");
                      setPriorityFilter("all");
                      setContactReadinessFilter("all");
                      setScoreFilter("all");
                      setWorkflowStatusFilter("all");
                    }}
                    className="text-[12px]"
                  >
                    Reset filters
                  </Button>
                }
              >
                Try a different keyword or switch to &quot;All&quot;.
              </StateMessage>
            )}
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-line bg-card p-6">
          <StateMessage
            icon="table"
            title="No live leads saved yet"
            action={
              <ButtonLink href="/discover" variant="primary" className="text-[12px]">
                <Icon name="search" size={14} />
                Open Discover
              </ButtonLink>
            }
          >
            Search for businesses in Discover (e.g. Raffles Place, Singapore), then click{" "}
            <strong className="text-ink">&quot;Save lead&quot;</strong> on any business card to save
            real prospects here for review.
          </StateMessage>
        </div>
      )}
    </section>
  );
}
