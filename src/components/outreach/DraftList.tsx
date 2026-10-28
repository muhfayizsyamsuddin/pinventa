import { DraftStatusBadge } from "@/components/ui/StatusBadge";
import type { OutreachDraft } from "@/types/pinventa";

interface DraftListProps {
  drafts: OutreachDraft[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function DraftList({ drafts, activeId, onSelect }: DraftListProps) {
  return (
    <ul className="flex flex-col gap-2 p-3" aria-label="Draft variants">
      {drafts.map((draft) => {
        const active = draft.id === activeId;
        return (
          <li key={draft.id}>
            <button
              type="button"
              onClick={() => onSelect(draft.id)}
              aria-pressed={active}
              className={`flex w-full flex-col gap-1.5 rounded border p-3 text-left transition-colors ${
                active
                  ? "border-primary bg-stone"
                  : "border-transparent bg-sunken hover:bg-strong/60"
              }`}
            >
              <span className="flex items-center gap-2 text-[13px] font-semibold">
                <span
                  className={`h-2 w-2 rounded-full ${active ? "bg-primary" : "bg-line-strong"}`}
                  aria-hidden="true"
                />
                {draft.title}
              </span>
              <span className="text-[12px] text-ink-2">{draft.summary}</span>
              <DraftStatusBadge status={draft.status} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
