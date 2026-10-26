import { Icon } from "@/components/ui/Icon";
import { Panel } from "@/components/ui/Panel";
import { ProvenanceBadge } from "@/components/ui/StatusBadge";
import type { ObservedFact, OpportunityHypothesis } from "@/types/pinventa";

/** Section 1: only facts present in a source record. Missing = "Not listed". */
export function ObservedFacts({
  facts,
  sourceLabel,
}: {
  facts: ObservedFact[];
  sourceLabel: string;
}) {
  const found = facts.filter((f) => f.value !== null).length;
  return (
    <Panel
      title="Observed facts"
      icon="shield-check"
      meta={`${found} of ${facts.length} fields populated`}
    >
      <div className="flex flex-col gap-3 p-4">
        <p className="text-[12px] leading-[18px] text-ink-2">
          Only data present in the source record is shown here. Fields that were
          not found stay empty instead of being filled in.
        </p>
        <dl className="flex flex-col gap-2">
          {facts.map((fact) => (
            <div
              key={fact.label}
              className="flex flex-col justify-between gap-1 rounded bg-sunken px-3 py-2.5 sm:flex-row sm:items-center"
            >
              <div>
                <dt className="label-caps">{fact.label}</dt>
                <dd
                  className={
                    fact.value === null
                      ? "font-mono text-[13px] italic text-ink-3"
                      : "font-mono text-[13px] font-medium text-ink"
                  }
                >
                  {fact.value ?? "Not listed"}
                </dd>
              </div>
              {fact.tag && (
                <span className="self-start rounded-sm bg-strong px-1.5 py-0.5 text-[10px] text-ink-2 sm:self-auto">
                  {fact.tag}
                </span>
              )}
            </div>
          ))}
        </dl>
        <div className="flex items-center gap-2 border-t border-line pt-3">
          <span className="label-caps">Source</span>
          <ProvenanceBadge label={sourceLabel} />
        </div>
      </div>
    </Panel>
  );
}

/** Section 2: analytical hypotheses, clearly separated from facts. */
export function HypothesisList({
  hypotheses,
}: {
  hypotheses: OpportunityHypothesis[];
}) {
  return (
    <Panel
      title="Potential opportunities"
      icon="lightbulb"
      meta="Hypotheses — not facts"
    >
      <div className="flex flex-col gap-3 p-4">
        <p className="rounded border border-line bg-sunken p-3 text-[12px] leading-[18px] text-ink-2">
          <strong className="font-semibold text-ink">Analytical note:</strong>{" "}
          These are inferences to test in conversation. They are not observed
          facts, and nothing here describes this company&apos;s internal problems.
        </p>
        {hypotheses.map((h) => (
          <article key={h.id} className="flex flex-col gap-1.5 rounded-lg border border-line bg-stone p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="label-caps flex items-center gap-1.5 !text-primary">
                <Icon name="lightbulb" size={13} />
                {h.kindLabel}
              </span>
              <span className="rounded-sm bg-amber-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-amber">
                Hypothesis
              </span>
            </div>
            <h3 className="text-[14px] font-semibold">{h.title}</h3>
            <p className="text-[13px] leading-5 text-ink-2">{h.body}</p>
            <p className="text-[11px] italic text-ink-3">{h.basis}</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}
