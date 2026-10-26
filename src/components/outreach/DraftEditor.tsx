"use client";

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { DraftStatusBadge } from "@/components/ui/StatusBadge";
import type { DraftStatus, OutreachDraft } from "@/types/pinventa";

interface DraftEditorProps {
  draft: OutreachDraft;
  recipientNote: string;
  message: string;
  onChange: (patch: Partial<Pick<OutreachDraft, "subject" | "body">>) => void;
  onStatus: (status: DraftStatus) => void;
  onCopy: () => void;
  onSave: () => void;
}

const FIELD =
  "w-full rounded border border-line bg-sunken px-3 py-2.5 text-[13px] text-ink focus:border-primary focus:bg-card focus:outline-none";

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Editable draft with a human-review workflow. There is no send action. */
export function DraftEditor({
  draft,
  recipientNote,
  message,
  onChange,
  onStatus,
  onCopy,
  onSave,
}: DraftEditorProps) {
  const reviewing = draft.status === "in_review";
  const closed = draft.status === "approved" || draft.status === "rejected";
  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
        <div>
          <h2 className="text-[16px] font-semibold">{draft.title}</h2>
          <p className="text-[12px] text-ink-2">{draft.summary}</p>
        </div>
        <DraftStatusBadge status={draft.status} />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="label-caps">Recipient</span>
        <div className="flex items-center gap-2 rounded border border-line bg-sunken px-3 py-2.5 font-mono text-[12px]">
          <span className="text-ink-3">To:</span>
          <span className="rounded-sm bg-strong px-1.5 py-0.5">[Recipient not verified]</span>
        </div>
        <p className="flex items-start gap-1.5 text-[12px] text-ink-2">
          <Icon name="info" size={14} className="mt-0.5 shrink-0 text-amber" />
          {recipientNote}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="draft-subject" className="label-caps">
            Subject line
          </label>
          <span className="font-mono text-[11px] text-ink-3">{draft.subject.length} chars</span>
        </div>
        <input
          id="draft-subject"
          type="text"
          value={draft.subject}
          onChange={(e) => onChange({ subject: e.target.value })}
          className={`${FIELD} font-semibold`}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="draft-body" className="label-caps">
            Email body
          </label>
          <span className="font-mono text-[11px] text-ink-3">{wordCount(draft.body)} words</span>
        </div>
        <textarea
          id="draft-body"
          rows={13}
          value={draft.body}
          onChange={(e) => onChange({ body: e.target.value })}
          className={`${FIELD} resize-y leading-[22px]`}
        />
        <p className="text-[11px] text-ink-3">
          Bracketed text is a placeholder to fill with a verified fact before use.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={onCopy}>
            <Icon name="copy" size={14} />
            Copy to clipboard
          </Button>
          <Button onClick={onSave}>
            <Icon name="save" size={14} />
            Save changes
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {draft.status === "draft" && (
            <Button onClick={() => onStatus("in_review")}>Submit for review</Button>
          )}
          {reviewing && (
            <>
              <Button onClick={() => onStatus("approved")}>
                <Icon name="check" size={14} />
                Approve
              </Button>
              <Button variant="ghost" onClick={() => onStatus("rejected")}>
                Reject
              </Button>
            </>
          )}
          {closed && (
            <Button variant="ghost" onClick={() => onStatus("draft")}>
              Reopen as draft
            </Button>
          )}
        </div>
      </div>

      <p role="status" aria-live="polite" className="min-h-4 text-[12px] text-ink-2">
        {message}
      </p>
    </div>
  );
}
