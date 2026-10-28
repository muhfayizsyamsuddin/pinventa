import type { Lead, LeadStatus } from "@/types/pinventa";

interface SummaryCardProps {
  label: string;
  count: number;
  total: number;
  barClass: string;
}

function SummaryCard({ label, count, total, barClass }: SummaryCardProps) {
  const pct = total === 0 ? 0 : (count / total) * 100;
  return (
    <div className="flex flex-col justify-between rounded-lg border border-line bg-card p-3">
      <span className="label-caps">{label}</span>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-[20px] font-medium leading-7">{count}</span>
        <span className="font-mono text-[11px] text-ink-3">/ {total} illustrative</span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
        <div className={`h-full ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const CARDS: { label: string; status: LeadStatus | "all"; barClass: string }[] = [
  { label: "Total sample", status: "all", barClass: "bg-ink-2" },
  { label: "Qualified", status: "qualified", barClass: "bg-sage" },
  { label: "Researching", status: "researching", barClass: "bg-amber" },
  { label: "Needs verification", status: "needs_verification", barClass: "bg-ink-3" },
];

export function LeadsSummary({ leads }: { leads: Lead[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {CARDS.map((card) => (
        <SummaryCard
          key={card.label}
          label={card.label}
          total={leads.length}
          barClass={card.barClass}
          count={
            card.status === "all"
              ? leads.length
              : leads.filter((l) => l.status === card.status).length
          }
        />
      ))}
    </div>
  );
}
