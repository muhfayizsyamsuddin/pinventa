import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Panel } from "@/components/ui/Panel";
import { SCORE_META, SCORE_ORDER } from "@/lib/config";
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
  onScore?: () => void;
  isScoring?: boolean;
  error?: string | null;
  scoringModel?: string;
  scoringProvider?: string;
  scoredAt?: string;
}

/** Weighted, auditable score: each pillar shows weight, points, reason, evidence, and limitations. */
export function ScoreBreakdown({
  components,
  illustrative = false,
  onScore,
  isScoring = false,
  error = null,
  scoringModel,
  scoringProvider,
  scoredAt,
}: ScoreBreakdownProps) {
  if (components.length === 0) {
    return (
      <Panel title="Qualification score" icon="layers" meta="Unscored">
        <div className="flex flex-col gap-4 p-4">
          <div>
            <div className="tnum flex items-baseline gap-2 font-mono">
              <span className="text-[36px] font-bold text-ink-3">—</span>
              <span className="text-[18px] text-line-strong">/ 100</span>
            </div>
            <p className="mt-1 text-[12px] font-medium text-ink-2">Unscored — Pending AI qualification</p>
            <p className="mt-0.5 text-[11px] text-ink-3">
              Official FR-04 qualification assesses 4 weighted criteria deterministically.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-danger/30 bg-danger-soft p-3 text-[12px] text-danger">
              <div className="flex items-start gap-2">
                <Icon name="alert" size={15} className="mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="font-semibold">AI Scoring Notice</p>
                  <p className="leading-relaxed">{error}</p>
                </div>
              </div>
            </div>
          )}

          {onScore && (
            <div className="flex flex-col gap-2 rounded-lg border border-line bg-card p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-[12px] font-semibold text-ink">Run AI Qualification</p>
                  <p className="text-[11px] text-ink-3">
                    Evaluates live OSM facts using server-side AI with anti-hallucination constraints.
                  </p>
                </div>
                <Button
                  variant="primary"
                  className="h-8 shrink-0 px-3 text-[12px]"
                  onClick={onScore}
                  disabled={isScoring}
                >
                  <Icon
                    name={isScoring ? "loader" : "layers"}
                    size={13}
                    className={isScoring ? "animate-spin" : ""}
                  />
                  {isScoring ? "Scoring…" : "Score with AI"}
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-b border-line pb-2">
            <h3 className="text-[13px] font-semibold">Official qualification pillars (FR-04)</h3>
            <span className="font-mono text-[11px] text-ink-3">Σ weights = 100%</span>
          </div>

          <ul className="flex flex-col gap-2">
            {SCORE_ORDER.map((key, i) => {
              const meta = SCORE_META[key];
              const descriptions: Record<string, string> = {
                fit: "Relevance of industry, operations, and B2B profile to MAXY enterprise services.",
                opportunity: "Identifiable digital presence gaps and AI transformation potential supported by data.",
                contact: "Availability of listed communication channels (website, phone, email) in source records.",
                quality: "Completeness, source traceability, and confidence of available evidence.",
              };
              return (
                <li key={key} className="rounded border border-line bg-stone p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold">
                      {i + 1}. {meta.label}
                    </span>
                    <span className="font-mono text-[11px] text-ink-3">{meta.weightPct}% weight</span>
                  </div>
                  <p className="mt-1 text-[11px] text-ink-2">{descriptions[key]}</p>
                </li>
              );
            })}
          </ul>

          <p className="text-[11px] leading-4 text-ink-3">
            Recommendation categories: High-Priority Prospect (80–100), Medium-Priority Prospect (60–79), Low-Priority / Requires Research (&lt;60). Priority recommendations do not imply automatic qualification.
          </p>
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
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="tnum flex items-baseline gap-2 font-mono">
                <span className="text-[44px] font-bold leading-none">{total}</span>
                <span className="text-[20px] text-line-strong">/ 100</span>
              </div>
              <p className="mt-1 text-[13px] font-semibold text-ink">{PRIORITY_LABEL[band]}</p>
            </div>
            {onScore && (
              <Button
                variant="secondary"
                className="h-7 px-2.5 text-[11px]"
                onClick={onScore}
                disabled={isScoring}
              >
                <Icon
                  name={isScoring ? "loader" : "reset"}
                  size={12}
                  className={isScoring ? "animate-spin" : ""}
                />
                {isScoring ? "Scoring…" : "Re-score"}
              </Button>
            )}
          </div>

          <p className="mt-1.5 text-[11px] leading-4 text-ink-3">
            Priority recommendation computed deterministically from 4 AI-evaluated components. Not an automated qualification or authorization for unsolicited outreach.
          </p>

          {illustrative && (
            <span className="mt-2 inline-block rounded-sm bg-strong px-2 py-0.5 text-[11px] font-medium text-ink-2">
              Illustrative score — not computed from real data
            </span>
          )}

          {error && (
            <div className="mt-3 rounded-lg border border-danger/30 bg-danger-soft p-2.5 text-[12px] text-danger">
              <div className="flex items-center gap-1.5">
                <Icon name="alert" size={13} />
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-b border-line pb-2">
          <h3 className="text-[13px] font-semibold">Auditable weighted breakdown</h3>
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
                  <p className="font-mono text-[11px] text-ink-3">
                    {c.weightPct}% weight · Sub-score {c.score}/100
                  </p>
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
                <div
                  className={`h-full ${BAND_BAR[priorityBand(c.score)]}`}
                  style={{ width: `${c.score}%` }}
                />
              </div>

              {/* Justification Reason */}
              <p className="mt-2.5 text-[12px] leading-[18px] text-ink-2">{c.reason}</p>

              {/* Auditable Evidence */}
              {c.evidence && (
                <div className="mt-2 flex items-start gap-1.5 rounded bg-card/60 p-2 text-[11px] leading-[16px] text-ink-2 border border-line/60">
                  <Icon name="shield-check" size={13} className="mt-0.5 shrink-0 text-sage" />
                  <div>
                    <span className="font-semibold text-ink">Evidence: </span>
                    {c.evidence}
                  </div>
                </div>
              )}

              {/* Data Limitations */}
              {c.limitations && (
                <div className="mt-1.5 flex items-start gap-1.5 rounded bg-amber-soft/40 p-2 text-[11px] leading-[16px] text-amber border border-amber/20">
                  <Icon name="info" size={13} className="mt-0.5 shrink-0 text-amber" />
                  <div>
                    <span className="font-semibold text-amber">Limitations: </span>
                    <span className="text-ink-2">{c.limitations}</span>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ol>

        {/* Scoring audit metadata */}
        {(scoredAt || scoringModel) && (
          <div className="border-t border-line pt-2 text-[11px] text-ink-3 flex flex-wrap items-center justify-between gap-2">
            <span>
              Evaluated by AI Agent
              {scoringModel ? ` (${scoringModel}${scoringProvider ? ` on ${scoringProvider}` : ""})` : ""}
            </span>
            {scoredAt && (
              <span className="font-mono">
                {new Date(scoredAt).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}
