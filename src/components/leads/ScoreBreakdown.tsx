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
  if (components.length === 0) {
    return (
      <Panel title="Qualification score" icon="layers" meta="Pending scoring">
        <div className="flex flex-col gap-4 p-4">
          <div>
            <div className="tnum flex items-baseline gap-2 font-mono">
              <span className="text-[36px] font-bold text-ink-3">—</span>
              <span className="text-[18px] text-line-strong">/ 100</span>
            </div>
            <p className="mt-1 text-[12px] font-medium text-ink-2">Awaiting AI qualification scoring</p>
            <div className="mt-3 rounded border border-line bg-sunken p-3 text-[12px] leading-[18px] text-ink-2">
              <p className="font-semibold text-ink">Scoring model status:</p>
              <p className="mt-1">
                Automated multi-pillar AI scoring (Fit 30%, Opportunity 25%, Contact Readiness 25%, Data Quality 20%) is scheduled for Milestone 3 (n8n + OpenRouter).
              </p>
              <p className="mt-2 text-ink-3">
                This lead is currently queued for human sales review under status <strong className="text-ink">Needs Verification</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-line pb-2">
            <h3 className="text-[13px] font-semibold">Scheduled qualification pillars</h3>
            <span className="font-mono text-[11px] text-ink-3">4 planned pillars</span>
          </div>

          <ul className="flex flex-col gap-2">
            {[
              { label: "Business Fit", weight: "30%", desc: "Relevance of industry and operations to MAXY enterprise services" },
              { label: "Opportunity Assessment", weight: "25%", desc: "Identified pain points and digital growth potential" },
              { label: "Contact Readiness", weight: "25%", desc: "Presence and verification of communication channels" },
              { label: "Data Quality & Traceability", weight: "20%", desc: "Verifiability of source records against OpenStreetMap" },
            ].map((p, i) => (
              <li key={p.label} className="rounded border border-line bg-stone p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold">{i + 1}. {p.label}</span>
                  <span className="font-mono text-[11px] text-ink-3">{p.weight}</span>
                </div>
                <p className="mt-1 text-[11px] text-ink-2">{p.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </Panel>
    );
  }

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
