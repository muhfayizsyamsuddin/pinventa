
import type { LeadStatus } from "@/types/pinventa";

export const LEAD_STATUS_OPTIONS: {
    value: LeadStatus;
    label: string;
}[] = [
        { value: "discovered", label: "Discovered" },
        { value: "researching", label: "Researching" },
        { value: "needs_verification", label: "Needs Verification" },
        { value: "qualified", label: "Qualified" },
        { value: "ready_for_review", label: "Ready for Review" },
        { value: "approved_for_outreach", label: "Approved for Outreach" },
        { value: "rejected", label: "Rejected" },
    ];

const STATUS_TRANSITIONS: Record<LeadStatus, readonly LeadStatus[]> = {
    discovered: ["researching", "needs_verification", "rejected"],
    researching: ["needs_verification", "qualified", "rejected"],
    needs_verification: ["researching", "qualified", "rejected"],
    qualified: ["researching", "needs_verification", "ready_for_review", "rejected"],
    ready_for_review: [
        "qualified",
        "needs_verification",
        "approved_for_outreach",
        "rejected",
    ],
    approved_for_outreach: ["ready_for_review", "qualified", "rejected"],
    rejected: ["researching", "needs_verification", "qualified"],
};

export function getLeadStatusLabel(status: LeadStatus): string {
    return LEAD_STATUS_OPTIONS.find((item) => item.value === status)?.label ?? status;
}

export function getAllowedLeadStatusTransitions(
    current: LeadStatus,
): LeadStatus[] {
    return [...STATUS_TRANSITIONS[current]];
}

export function canTransitionLeadStatus(
    current: LeadStatus,
    next: LeadStatus,
): boolean {
    return current === next || STATUS_TRANSITIONS[current].includes(next);
}
