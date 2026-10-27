"use client";

import { useEffect, useState } from "react";
import { DraftEditor } from "@/components/outreach/DraftEditor";
import { DraftList } from "@/components/outreach/DraftList";
import { Panel } from "@/components/ui/Panel";
import {
  loadDraftsForLead,
  saveDraftsForLead,
  subscribeDraftStore,
} from "@/lib/outreach-generator";
import type { DraftStatus, Lead, OutreachDraft } from "@/types/pinventa";

interface OutreachStudioProps {
  lead: Lead;
  drafts: OutreachDraft[];
}

/**
 * Outreach Studio supporting draft variant switching, editing, local persistence per lead,
 * human review status lifecycle, and copy-to-clipboard. Pinventa never sends emails.
 */
export function OutreachStudio({ lead, drafts: initial }: OutreachStudioProps) {
  const [drafts, setDrafts] = useState<OutreachDraft[]>(() => {
    if (typeof window !== "undefined") {
      const saved = loadDraftsForLead(lead.id);
      if (saved && saved.length > 0) return saved;
    }
    return initial;
  });
  const [activeId, setActiveId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = loadDraftsForLead(lead.id);
      if (saved && saved.length > 0) return saved[0].id;
    }
    return initial[0]?.id ?? "";
  });
  const [message, setMessage] = useState<string>("");

  // Listen for storage changes from other tabs or store updates
  useEffect(() => {
    return subscribeDraftStore(() => {
      const saved = loadDraftsForLead(lead.id);
      if (saved && saved.length > 0) {
        setDrafts(saved);
      }
    });
  }, [lead.id]);

  const active = drafts.find((d) => d.id === activeId) ?? drafts[0];
  if (!active) return null;

  function patch(update: Partial<OutreachDraft>) {
    setDrafts((prev) => prev.map((d) => (d.id === active.id ? { ...d, ...update } : d)));
    setMessage("");
  }

  function handleSave() {
    saveDraftsForLead(lead.id, drafts);
    setMessage(`Changes saved to storage for ${lead.name}.`);
  }

  async function copy() {
    const text = `Subject: ${active.subject}\n\n${active.body}`;
    try {
      await navigator.clipboard.writeText(text);
      setMessage("Draft copied to clipboard. It has not been sent.");
    } catch {
      setMessage("Copy failed. Select the text and copy it manually.");
    }
  }

  function setStatus(status: DraftStatus) {
    const nextDrafts = drafts.map((d) => (d.id === active.id ? { ...d, status } : d));
    setDrafts(nextDrafts);
    saveDraftsForLead(lead.id, nextDrafts);
    setMessage(
      status === "approved"
        ? "Marked as approved by reviewer. Pinventa does not send email."
        : status === "rejected"
          ? "Draft marked as rejected."
          : status === "in_review"
            ? "Submitted for human review."
            : "Reopened as draft.",
    );
  }

  const recipientDisplay = lead.emailReady
    ? lead.email
    : lead.email
      ? `${lead.email} [Unverified OSM listing]`
      : "[Recipient not verified — address needs verification]";

  const recipientNote = lead.emailReady
    ? "A source-traceable work email exists for this lead. Confirm the contact before use."
    : lead.email
      ? `OSM source lists '${lead.email}', but deliverability is unverified (Needs Verification). Confirm contact before any outreach.`
      : "No verified work email is on record for this lead (Needs Verification). Add a recipient only from a verified source. Never guess an address.";

  const isLive = lead.dataOrigin === "live";

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <div className="flex flex-col gap-6 lg:col-span-4">
        <Panel title="Observed business context" icon="shield-check" meta="Informing facts">
          <dl className="flex flex-col gap-2 p-4 text-[13px]">
            <div className="rounded bg-sunken px-3 py-2">
              <dt className="label-caps">Lead</dt>
              <dd className="font-medium text-ink">{lead.name}</dd>
            </div>
            <div className="rounded bg-sunken px-3 py-2">
              <dt className="label-caps">Category</dt>
              <dd className="text-ink">{lead.category}</dd>
            </div>
            <div className="rounded bg-sunken px-3 py-2">
              <dt className="label-caps">Location</dt>
              <dd className="text-ink">
                {lead.area} ·{" "}
                <span className="font-mono text-[12px] text-ink-2">
                  {lead.distanceKm.toFixed(1)} km from center
                </span>
              </dd>
            </div>
            {lead.websiteUrl && (
              <div className="rounded bg-sunken px-3 py-2">
                <dt className="label-caps">Website (OSM)</dt>
                <dd className="text-ink">
                  <a
                    href={lead.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-press underline-offset-2 hover:underline"
                  >
                    {lead.websiteUrl} ↗
                  </a>
                </dd>
              </div>
            )}
            {lead.phoneNumber && (
              <div className="rounded bg-sunken px-3 py-2">
                <dt className="label-caps">Phone (OSM)</dt>
                <dd className="font-mono text-[12px] text-ink">{lead.phoneNumber}</dd>
              </div>
            )}
            <div className="rounded bg-sunken px-3 py-2">
              <dt className="label-caps">Source Reference</dt>
              <dd className="text-ink">
                {lead.osmUrl ? (
                  <a
                    href={lead.osmUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-press underline-offset-2 hover:underline"
                  >
                    {lead.sourceLabel} ↗
                  </a>
                ) : (
                  lead.sourceLabel
                )}
              </dd>
            </div>

            {lead.hypotheses[0] ? (
              <div className="rounded border border-line bg-stone px-3 py-2">
                <dt className="label-caps !text-primary">Opportunity hypothesis</dt>
                <dd className="text-[12px] leading-[18px] text-ink-2">
                  {lead.hypotheses[0].title}. {lead.hypotheses[0].basis}
                </dd>
              </div>
            ) : isLive ? (
              <div className="rounded border border-line bg-stone px-3 py-2">
                <dt className="label-caps !text-primary">Opportunity hypothesis</dt>
                <dd className="text-[12px] leading-[18px] text-ink-2">
                  Exploratory proposals tailored to {lead.category.toLowerCase()} services. Internal
                  operating challenges are unverified and require primary discovery.
                </dd>
              </div>
            ) : null}
          </dl>
        </Panel>

        <Panel
          title="Draft selector"
          icon="layers"
          meta={`${drafts.length} variants`}
        >
          {isLive && (
            <div className="border-b border-line bg-stone/70 px-4 py-2 text-[11px] text-ink-2">
              <span className="font-semibold text-ink">Rule-based templates:</span> Drafts
              grounded in observed map records. AI generation (Criterion 7) scheduled for
              Milestone 3.
            </div>
          )}
          <DraftList
            drafts={drafts}
            activeId={active.id}
            onSelect={(id) => {
              setActiveId(id);
              setMessage("");
            }}
          />
        </Panel>
      </div>

      <Panel className="lg:col-span-8">
        <DraftEditor
          draft={active}
          recipientDisplay={recipientDisplay}
          recipientNote={recipientNote}
          message={message}
          onChange={(p) => patch(p)}
          onStatus={setStatus}
          onCopy={copy}
          onSave={handleSave}
        />
      </Panel>
    </div>
  );
}
