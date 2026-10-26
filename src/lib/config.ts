import type { Industry, RadiusKm, ScoreComponent, ScoreComponentKey } from "@/types/pinventa";

/** Radius options (study case FR-01 cites e.g. 1–5 km). */
export const RADII: RadiusKm[] = [1, 2, 3, 5, 10];
export const DEFAULT_RADIUS: RadiusKm = 3;

/**
 * Placeholder industry list. Marketing owns the final list (see
 * docs/IMPLEMENTATION_PLAN.md, `config/industries.json`).
 */
export const INDUSTRIES: Industry[] = [
  { id: "professional", label: "Business & professional services" },
  { id: "accounting", label: "Accounting & tax" },
  { id: "consulting", label: "Management consulting" },
  { id: "legal", label: "Legal services" },
  { id: "financial", label: "Financial services" },
  { id: "it", label: "IT & software services" },
];

/** Official lead-score weights (study case FR-04). Must sum to 100. */
export const SCORE_META: Record<
  ScoreComponentKey,
  { label: string; weightPct: number }
> = {
  fit: { label: "Industry & Customer Fit", weightPct: 30 },
  opportunity: { label: "Identifiable Digital / AI Opportunity", weightPct: 25 },
  contact: { label: "Contact Readiness", weightPct: 25 },
  quality: { label: "Data Quality & Evidence Confidence", weightPct: 20 },
};

export const SCORE_ORDER: ScoreComponentKey[] = [
  "fit",
  "opportunity",
  "contact",
  "quality",
];

export function makeComponent(
  key: ScoreComponentKey,
  score: number,
  reason: string,
): ScoreComponent {
  return { key, score, reason, ...SCORE_META[key] };
}
