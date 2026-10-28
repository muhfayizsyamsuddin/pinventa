
"use client";

import type { LeadStatus } from "@/types/pinventa";
import {
  getAllowedLeadStatusTransitions,
  getLeadStatusLabel,
} from "@/lib/lead-status";

type WorkflowStatusSelectVariant = "table" | "detail";

interface WorkflowStatusSelectProps {
  id?: string;
  status: LeadStatus;
  emailReady: boolean;
  onChange: (next: LeadStatus) => void;
  ariaLabel: string;
  variant?: WorkflowStatusSelectVariant;
}

const VARIANT_CLASSES: Record<WorkflowStatusSelectVariant, string> = {
  table:
    "h-6 min-w-[175px] cursor-pointer rounded-sm border border-line bg-strong/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-2 focus:border-primary focus:outline-none",
  detail:
    "h-8 min-w-[175px] cursor-pointer rounded border border-line bg-card px-3 text-[12px] font-medium text-ink focus:border-primary focus:outline-none",
};

export function WorkflowStatusSelect({
  id,
  status,
  emailReady,
  onChange,
  ariaLabel,
  variant = "table",
}: WorkflowStatusSelectProps) {
  const availableTransitions = getAllowedLeadStatusTransitions(status).filter(
    (nextStatus) =>
      nextStatus !== "approved_for_outreach" || emailReady,
  );

  return (
    <select
      id={id}
      className={VARIANT_CLASSES[variant]}
      value={status}
      onChange={(event) => onChange(event.target.value as LeadStatus)}
      aria-label={ariaLabel}
    >
      <option value={status}>{getLeadStatusLabel(status)}</option>
      {availableTransitions
        .filter((nextStatus) => nextStatus !== status)
        .map((nextStatus) => (
          <option key={nextStatus} value={nextStatus}>
            {getLeadStatusLabel(nextStatus)}
          </option>
        ))}
    </select>
  );
}
