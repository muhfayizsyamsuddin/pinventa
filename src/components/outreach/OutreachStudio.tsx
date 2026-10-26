"use client";

import { useState } from "react";
import { DraftEditor } from "@/components/outreach/DraftEditor";
import { DraftList } from "@/components/outreach/DraftList";
import { Panel } from "@/components/ui/Panel";
import type { DraftStatus, Lead, OutreachDraft } from "@/types/pinventa";

interface OutreachStudioProps {
  lead: Lead;
  drafts: OutreachDraft[];
}

/**
 * Draft state lives only in this browser session; nothing is persisted or sent.
 */
export function OutreachStudio({ lead, drafts: initial }: OutreachStudioProps) {
  const [drafts, setDrafts] = useState(initial);
  const [activeId, setActiveId] = useState(initial[0]?.id ?? "");
  const [message, setMessage] = useState("");

  const active = drafts.find((d) => d.id === activeId) ?? drafts[0];
  if (!active) return null;

  function patch(update: Partial<OutreachDraft>) {
    setDrafts((prev) => prev.map((d) => (d.id === active.id ? { ...d, ...update } : d)));
    setMessage("");
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
    patch({ status });
    setMessage(
      status === "approved"
        ? "Marked as approved by reviewer. Pinventa does not send email."
        : status === "rejected"
          ? "Draft rejected."
          : status === "in_review"
            ? "Submitted for human review."
            : "Reopened as draft.",
    );
  }

  const recipientNote = lead.emailReady
    ? "A source-traceable work email exists for this lead. Confirm the contact before use."
    : "No verified work email is on record for this lead (Needs Verification). Add a recipient only from a verified source. Never guess an address.";

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <div className="flex flex-col gap-6 lg:col-span-4">
        <Panel title="Observed business context" icon="shield-check" meta="Informing facts">
          <dl className="flex flex-col gap-2 p-4 text-[13px]">
            {[
              ["Lead", lead.name],
              ["Category", lead.category],
              ["Location", `${lead.area}, ${lead.distanceKm.toFixed(1)} km from center`],
            ].map(([label, value]) => (
              <div key={label} className="rounded bg-sunken px-3 py-2">
                <dt className="label-caps">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
            {lead.hypotheses[0] && (
              <div className="rounded border border-line bg-stone px-3 py-2">
                <dt className="label-caps !text-primary">Opportunity hypothesis</dt>
                <dd className="text-[12px] leading-[18px] text-ink-2">
                  {lead.hypotheses[0].title}. {lead.hypotheses[0].basis}
                </dd>
              </div>
            )}
          </dl>
        </Panel>

        <Panel title="Draft selector" icon="layers" meta={`${drafts.length} variants`}>
          <DraftList drafts={drafts} activeId={active.id} onSelect={(id) => { setActiveId(id); setMessage(""); }} />
        </Panel>
      </div>

      <Panel className="lg:col-span-8">
        <DraftEditor
          draft={active}
          recipientNote={recipientNote}
          message={message}
          onChange={(p) => patch(p)}
          onStatus={setStatus}
          onCopy={copy}
          onSave={() => setMessage("Changes kept for this browser session only. Nothing is stored yet.")}
        />
      </Panel>
    </div>
  );
}
