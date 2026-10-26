import type { DraftStatus, LeadStatus } from "@/types/pinventa";

type Tone = "sage" | "amber" | "neutral" | "primary" | "danger";

const TONES: Record<Tone, string> = {
  sage: "bg-sage-soft text-sage border-sage/20",
  amber: "bg-amber-soft text-amber border-amber/25",
  neutral: "bg-strong/60 text-ink-2 border-line",
  primary: "bg-primary-soft text-primary-press border-primary/20",
  danger: "bg-danger-soft text-danger border-danger/20",
};

function Pill({ tone, children }: { tone: Tone; children: string }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

const LEAD_STATUS: Record<LeadStatus, { label: string; tone: Tone }> = {
  discovered: { label: "Discovered", tone: "neutral" },
  researching: { label: "Researching", tone: "amber" },
  needs_verification: { label: "Needs Verification", tone: "neutral" },
  qualified: { label: "Qualified", tone: "sage" },
  ready_for_review: { label: "Ready for Review", tone: "primary" },
  approved_for_outreach: { label: "Approved for Outreach", tone: "sage" },
  rejected: { label: "Rejected", tone: "danger" },
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const { label, tone } = LEAD_STATUS[status];
  return <Pill tone={tone}>{label}</Pill>;
}

const DRAFT_STATUS: Record<DraftStatus, { label: string; tone: Tone }> = {
  draft: { label: "Draft — not reviewed", tone: "neutral" },
  in_review: { label: "Awaiting human review", tone: "amber" },
  approved: { label: "Approved by reviewer", tone: "sage" },
  rejected: { label: "Rejected", tone: "danger" },
};

export function DraftStatusBadge({ status }: { status: DraftStatus }) {
  const { label, tone } = DRAFT_STATUS[status];
  return <Pill tone={tone}>{label}</Pill>;
}

/** Marks illustrative content so it can never read as live data. */
export function DemoBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm border border-amber/30 bg-amber-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-amber ${className}`}
    >
      Demo
    </span>
  );
}

/** Provenance chip for a data source (DESIGN.md: Provenance Badges). */
export function ProvenanceBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-sm border border-line bg-stone px-1.5 py-0.5 font-mono text-[10px] text-ink-2">
      {label}
    </span>
  );
}
