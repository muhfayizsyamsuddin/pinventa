"use client";

import { useMemo, useState } from "react";
import { ExportCsvButton } from "@/components/leads/ExportCsvButton";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { Icon } from "@/components/ui/Icon";
import { StateMessage } from "@/components/ui/Panel";
import { priorityBand, totalScore } from "@/lib/scoring";
import type { Lead, LeadStatus, PriorityBand } from "@/types/pinventa";

type StatusFilter = LeadStatus | "all";
type ScoreFilter = PriorityBand | "all";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "qualified", label: "Qualified" },
  { value: "researching", label: "Researching" },
  { value: "needs_verification", label: "Needs Verification" },
];

const SCORE_OPTIONS: { value: ScoreFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "high", label: "High (80–100)" },
  { value: "medium", label: "Medium (60–79)" },
  { value: "low", label: "Low (<60)" },
];

const SELECT =
  "h-7 cursor-pointer rounded border border-line bg-card px-2 text-[12px] font-medium focus:border-primary focus:outline-none";

/** Filterable lead list with selection and CSV export. */
export function LeadsWorkspace({ leads }: { leads: Lead[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [band, setBand] = useState<ScoreFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((lead) => {
      if (status !== "all" && lead.status !== status) return false;
      if (band !== "all" && priorityBand(totalScore(lead.components)) !== band) return false;
      if (!q) return true;
      return [lead.name, lead.category, lead.subcategory, lead.refId]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [leads, query, status, band]);

  const exportable = visible.filter((l) => selected.has(l.id));
  const toExport = exportable.length > 0 ? exportable : visible;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      const allOn = visible.every((l) => prev.has(l.id));
      const next = new Set(prev);
      visible.forEach((l) => (allOn ? next.delete(l.id) : next.add(l.id)));
      return next;
    });
  }

  function clearFilters() {
    setQuery("");
    setStatus("all");
    setBand("all");
  }

  return (
    <>
      <div className="flex flex-col gap-3 rounded-lg border border-line bg-card p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Icon
              name="search"
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by name, category, or reference…"
              aria-label="Filter leads"
              className="h-9 w-full rounded-md border border-line bg-card pl-9 pr-3 text-[13px] placeholder:text-ink-3 focus:border-primary focus:outline-none"
            />
          </div>
          <ExportCsvButton leads={toExport} />
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-3">
          <span className="label-caps">Filters</span>
          <label className="flex items-center gap-1.5 text-[12px] text-ink-2">
            Status
            <select
              className={SELECT}
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-[12px] text-ink-2">
            Score
            <select
              className={SELECT}
              value={band}
              onChange={(e) => setBand(e.target.value as ScoreFilter)}
            >
              {SCORE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <span className="ml-auto font-mono text-[11px] text-ink-3" aria-live="polite">
            Showing {visible.length} of {leads.length} preview records
            {selected.size > 0 && ` · ${selected.size} selected`}
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-card">
        {visible.length > 0 ? (
          <LeadsTable
            leads={visible}
            selectedIds={selected}
            onToggle={toggle}
            onToggleAll={toggleAll}
          />
        ) : leads.length === 0 ? (
          <StateMessage icon="table" title="No leads yet">
            Leads you save from Discover will be listed here.
          </StateMessage>
        ) : (
          <StateMessage
            icon="search"
            title="No leads match these filters"
            action={
              <button
                type="button"
                onClick={clearFilters}
                className="rounded border border-line bg-card px-3 py-1.5 text-[12px] font-semibold hover:border-primary"
              >
                Clear filters
              </button>
            }
          >
            Adjust the search text or filters to see more records.
          </StateMessage>
        )}
        <div className="border-t border-line bg-stone px-4 py-2.5 font-mono text-[11px] text-ink-3">
          Export includes the selected rows, or all visible rows if none are selected.
        </div>
      </div>
    </>
  );
}
