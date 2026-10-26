import type { PriorityBand, ScoreComponent } from "@/types/pinventa";

/** Weighted points contributed by one component (score 0–100 × weight). */
export function componentPoints(c: ScoreComponent): number {
  return (c.score * c.weightPct) / 100;
}

/** Total 0–100, computed deterministically from component scores. */
export function totalScore(components: ScoreComponent[]): number {
  return Math.round(components.reduce((sum, c) => sum + componentPoints(c), 0));
}

/** Bands from the study case (FR-04): 80–100 high, 60–79 medium, below 60 low. */
export function priorityBand(total: number): PriorityBand {
  if (total >= 80) return "high";
  if (total >= 60) return "medium";
  return "low";
}

export const PRIORITY_LABEL: Record<PriorityBand, string> = {
  high: "High-Priority",
  medium: "Medium-Priority",
  low: "Low-Priority / Requires Research",
};
