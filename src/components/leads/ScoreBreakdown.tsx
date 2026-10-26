import { Panel } from "@/components/ui/Panel";
import { PRIORITY_LABEL, componentPoints, priorityBand, totalScore } from "@/lib/scoring";
import type { PriorityBand, ScoreComponent } from "@/types/pinventa";

const BAND_BAR: Record<PriorityBand, string> = {
  high: "bg-sage",
  medium: "bg-amber",
  low: "bg-ink-3",
};

interface ScoreBreakdownProps {
  components: ScoreComponent[];
  illustrative?: boolean;
}

/** Weighted, auditable score: each pillar shows weight, points, and reason. */
export function ScoreBreakdown({ components, illustrative = false }: ScoreBreakdownProps) {
  const total = totalScore(components);
  const band = priorityBand(total);
  const weightSum = components.reduce((s, c) => s + c.weightPct, 0);

  return (
    <Panel title="Qualification score" icon="layers" meta={`${components.length} pillars`}>
      <div className="flex flex-col gap-4 p-4">
        <div>
          <div className="tnum flex items-baseline gap-2 font-mono">
            <span className="text-[44px] font-bold leading-none">{total}</span>
            <span className="text-[20px] text-line-strong">/ 100</span>
          </div>
          <p className="mt-1 text-[12px] font-medium text-ink-2">{PRIORITY_LABEL[band]}</p>
          {illustrative && (
            <span className="mt-2 inline-block rounded-sm bg-strong px-2 py-0.5 text-[11px] font-medium text-ink-2">
              Illustrative score — not computed from real data
            </span>
          )}
        </div>

        <div className="flex items-center justify-between border-b border-line pb-2">
          <h3 className="text-[13px] font-semibold">Explainable weighted breakdown</h3>
          <span className="font-mono text-[11px] text-ink-3">Σ weights = {weightSum}%</span>
        </div>

        <ol className="flex flex-col gap-3">
          {components.map((c, i) => (
            <li key={c.key} className="rounded-lg border border-line bg-stone p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold">
                    {i + 1}. {c.label}
                  </p>
                  <p className="font-mono text-[11px] text-ink-3">{c.weightPct}% weight</p>
                </div>
                <p className="tnum font-mono text-[13px] font-bold">
                  {componentPoints(c).toFixed(1)}
                  <span className="font-normal text-ink-3"> / {c.weightPct}</span>
                </p>
              </div>
              <div
                className="mt-2 h-1 overflow-hidden rounded-full bg-line"
                role="meter"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={c.score}
                aria-label={`${c.label}: sub-score ${c.score} of 100`}
              >
                <div className={`h-full ${BAND_BAR[priorityBand(c.score)]}`} style={{ width: `${c.score}%` }} />
              </div>
              <p className="mt-2 text-[12px] leading-[18px] text-ink-2">{c.reason}</p>
            </li>
          ))}
        </ol>
      </div>
    </Panel>
  );
}
