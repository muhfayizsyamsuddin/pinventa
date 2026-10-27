/**
 * Domain types for the Pinventa UI.
 *
 * These are shaped so a backend (Overpass discovery, enrichment, scoring) can
 * return the same structures in a later milestone. Nothing here implies data
 * is real: every record carries `dataOrigin`.
 */

/** `demo` = illustrative sample shown for layout only. `live` = real query result. */
export type DataOrigin = "live" | "demo";

export type RadiusKm = 1 | 2 | 3 | 5 | 10;

export interface Industry {
  id: string;
  label: string;
}

export interface SearchQuery {
  location: string;
  radiusKm: RadiusKm;
  industryId: string;
}

/** UI states for a search; kept separate so each renders its own component. */
export type SearchViewState = "idle" | "loading" | "empty" | "error" | "data";

/** Whether a field was found in the source record. Never infer; never guess. */
export type FieldAvailability = "listed" | "not_listed";

/** How much of the expected detail the source record lists. Never inferred. */
export type DataCompleteness = "good" | "partial" | "minimal";

export interface BusinessResult {
  id: string;
  /** Only illustrative records link to a lead detail page (live leads: later milestone). */
  leadId?: string;
  name: string;
  category: string;
  area: string;
  distanceKm: number;
  website: FieldAvailability;
  phone: FieldAvailability;
  sourceLabel: string;
  /** Percent position on the schematic canvas (illustrative records only). */
  pin?: { x: number; y: number };
  dataOrigin: DataOrigin;
  /** Live (OpenStreetMap) fields; each present only if the source lists it. */
  lat?: number;
  lng?: number;
  address?: string;
  websiteUrl?: string;
  phoneNumber?: string;
  email?: string;
  /** Inspectable OpenStreetMap object page. */
  osmUrl?: string;
  completeness?: DataCompleteness;
}

/** Statuses suggested by the MAXY study case (FR-06). */
export type LeadStatus =
  | "discovered"
  | "researching"
  | "needs_verification"
  | "qualified"
  | "ready_for_review"
  | "approved_for_outreach"
  | "rejected";

export type ScoreComponentKey =
  | "fit"
  | "opportunity"
  | "contact"
  | "quality";

export interface ScoreComponent {
  key: ScoreComponentKey;
  label: string;
  /** Percentage weight; the four weights must sum to 100. */
  weightPct: number;
  /** 0–100 sub-score for this component. */
  score: number;
  /** Auditable explanation for the sub-score. */
  reason: string;
}

export type PriorityBand = "high" | "medium" | "low";

export interface ObservedFact {
  label: string;
  /** `null` means not found in source; render as "Not listed", never fill in. */
  value: string | null;
  /** Provenance tag, e.g. "Domain" or "Switchboard". */
  tag?: string;
}

export interface OpportunityHypothesis {
  id: string;
  kindLabel: string;
  title: string;
  body: string;
  /** What this hypothesis is (or is not) based on. */
  basis: string;
}

export interface Lead {
  id: string;
  refId: string;
  name: string;
  category: string;
  subcategory: string;
  area: string;
  distanceKm: number;
  website: FieldAvailability;
  phone: FieldAvailability;
  /** True only when a source-traceable work email exists. */
  emailReady: boolean;
  status: LeadStatus;
  components: ScoreComponent[];
  facts: ObservedFact[];
  hypotheses: OpportunityHypothesis[];
  sourceLabel: string;
  dataOrigin: DataOrigin;
  /** Live metadata fields (optional) */
  osmUrl?: string;
  completeness?: DataCompleteness;
  email?: string;
  websiteUrl?: string;
  phoneNumber?: string;
}

/** Human-review lifecycle for an outreach draft. Drafts are never sent. */
export type DraftStatus = "draft" | "in_review" | "approved" | "rejected";

export interface OutreachDraft {
  id: string;
  leadId: string;
  title: string;
  summary: string;
  subject: string;
  body: string;
  status: DraftStatus;
  dataOrigin: DataOrigin;
}
