import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { LeadScore } from "@/components/ui/LeadScore";
import { DemoBadge, LeadStatusBadge } from "@/components/ui/StatusBadge";
import { totalScore } from "@/lib/scoring";
import type { FieldAvailability, Lead } from "@/types/pinventa";

function Presence({ label, value, icon }: { label: string; value: FieldAvailability; icon: "globe" | "phone" }) {
  const listed = value === "listed";
  return (
    <span className={`flex items-center gap-1.5 text-[11px] ${listed ? "text-sage" : "text-ink-3"}`}>
      <Icon name={listed ? icon : "dash-circle"} size={13} />
      {label} {listed ? "listed" : "not listed"}
    </span>
  );
}

interface LeadsTableProps {
  leads: Lead[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
}

const TH = "label-caps px-3 py-2.5 text-left font-semibold";

export function LeadsTable({ leads, selectedIds, onToggle, onToggleAll }: LeadsTableProps) {
  const allSelected = leads.length > 0 && leads.every((l) => selectedIds.has(l.id));
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] border-collapse text-left">
        <thead>
          <tr className="border-b border-line bg-stone">
            <th scope="col" className="w-10 px-3 py-2.5">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                aria-label="Select all visible leads"
                className="h-3.5 w-3.5 accent-primary"
              />
            </th>
            <th scope="col" className={TH}>Lead</th>
            <th scope="col" className={TH}>Category</th>
            <th scope="col" className={TH}>Location</th>
            <th scope="col" className={TH}>Digital presence</th>
            <th scope="col" className={`${TH} text-right`}>Score</th>
            <th scope="col" className={TH}>Status</th>
            <th scope="col" className={`${TH} text-right`}>Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {leads.map((lead) => {
            const selected = selectedIds.has(lead.id);
            return (
              <tr
                key={lead.id}
                className={`group transition-colors hover:bg-stone ${
                  selected ? "bg-canvas shadow-[inset_2px_0_0_var(--color-primary)]" : ""
                }`}
              >
                <td className="px-3 py-3 align-top">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onToggle(lead.id)}
                    aria-label={`Select ${lead.name}`}
                    className="mt-1 h-3.5 w-3.5 accent-primary"
                  />
                </td>
                <td className="px-3 py-3 align-top">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="text-[13px] font-semibold hover:text-primary"
                    >
                      {lead.name}
                    </Link>
                    {lead.dataOrigin === "demo" && <DemoBadge />}
                  </div>
                  <span className="font-mono text-[11px] text-ink-3">{lead.refId}</span>
                </td>
                <td className="px-3 py-3 align-top">
                  <p className="text-[13px] font-medium">{lead.category}</p>
                  <p className="text-[11px] text-ink-3">{lead.subcategory}</p>
                </td>
                <td className="px-3 py-3 align-top">
                  <p className="text-[13px]">{lead.area}</p>
                  <p className="tnum font-mono text-[11px] text-ink-3">
                    {lead.distanceKm.toFixed(1)} km from center
                  </p>
                </td>
                <td className="px-3 py-3 align-top">
                  <div className="flex flex-col gap-1">
                    <Presence label="Website" value={lead.website} icon="globe" />
                    <Presence label="Phone" value={lead.phone} icon="phone" />
                  </div>
                </td>
                <td className="px-3 py-3 align-top">
                  <LeadScore
                    total={totalScore(lead.components)}
                    illustrative={lead.dataOrigin === "demo"}
                    unscored={lead.components.length === 0}
                  />
                </td>
                <td className="px-3 py-3 align-top">
                  <div className="flex flex-col items-start gap-1">
                    <LeadStatusBadge status={lead.status} />
                    <span className="text-[10px] text-ink-3">
                      {lead.emailReady ? "Email-ready" : "Not email-ready"}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3 align-top">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="rounded px-2 py-1 text-[12px] font-medium text-primary hover:bg-sunken"
                    >
                      Inspect
                    </Link>
                    <Link
                      href={`/outreach?lead=${lead.id}`}
                      className="inline-flex items-center gap-1 rounded border border-line bg-card px-2 py-1 text-[12px] font-medium hover:border-primary hover:bg-stone"
                    >
                      <Icon name="mail" size={13} className="text-primary" />
                      Outreach
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
