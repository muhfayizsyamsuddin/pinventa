import { PRIORITY_LABEL, priorityBand } from "@/lib/scoring";
import type { PriorityBand } from "@/types/pinventa";

const BAND_COLOR: Record<PriorityBand, { text: string; bar: string }> = {
  high: { text: "text-sage", bar: "bg-sage" },
  medium: { text: "text-amber", bar: "bg-amber" },
  low: { text: "text-ink-3", bar: "bg-ink-3" },
};

interface LeadScoreProps {
  total: number;
  /** Show the priority label under the meter. */
  showBand?: boolean;
  /** Mark scores that are not computed from real data. */
  illustrative?: boolean;
  /** True when the lead has not been evaluated by an AI scoring agent yet. */
  unscored?: boolean;
}

/** Compact total score with a 4px meter (DESIGN.md: Explainable Scoring Meters). */
export function LeadScore({
  total,
  showBand = false,
  illustrative = false,
  unscored = false,
}: LeadScoreProps) {
  if (unscored) {
    return (
      <div className="flex flex-col items-end gap-1">
        <span className="font-mono text-[12px] text-ink-3">— / 100</span>
        <span className="text-[10px] italic text-ink-3">Not scored</span>
      </div>
    );
  }
  const band = priorityBand(total);
  const color = BAND_COLOR[band];
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="tnum flex items-baseline gap-1 font-mono">
        <span className={`text-[15px] font-bold ${color.text}`}>{total}</span>
        <span className="text-[11px] text-ink-3">/ 100</span>
      </div>
      <div
        className="h-1 w-24 overflow-hidden rounded-full bg-line"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={total}
        aria-label={`Lead score ${total} out of 100`}
      >
        <div className={`h-full ${color.bar}`} style={{ width: `${total}%` }} />
      </div>
      {showBand && (
        <span className="text-[10px] text-ink-3">{PRIORITY_LABEL[band]}</span>
      )}
      {illustrative && (
        <span className="text-[10px] italic text-ink-3">Illustrative</span>
      )}
    </div>
  );
}
