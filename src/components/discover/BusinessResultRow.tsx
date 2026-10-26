import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { DemoBadge, ProvenanceBadge } from "@/components/ui/StatusBadge";
import { Icon } from "@/components/ui/Icon";
import type { BusinessResult, FieldAvailability } from "@/types/pinventa";

function Availability({
  label,
  icon,
  value,
}: {
  label: string;
  icon: "globe" | "phone";
  value: FieldAvailability;
}) {
  const listed = value === "listed";
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Icon name={listed ? icon : "dash-circle"} size={15} className={listed ? "text-sage" : "text-ink-3"} />
      <span className="label-caps">{label}</span>
      <span className={listed ? "text-[12px] text-ink" : "text-[12px] italic text-ink-3"}>
        {listed ? "Listed in record" : "Not listed in source"}
      </span>
    </div>
  );
}

interface BusinessResultRowProps {
  business: BusinessResult;
  index: number;
  active?: boolean;
  saved?: boolean;
  onHover?: (id: string | null) => void;
  onToggleSave?: (id: string) => void;
}

/** One discovered business as a dossier card. */
export function BusinessResultRow({
  business,
  index,
  active = false,
  saved = false,
  onHover,
  onToggleSave,
}: BusinessResultRowProps) {
  return (
    <article
      id={`business-${business.id}`}
      onMouseEnter={() => onHover?.(business.id)}
      onMouseLeave={() => onHover?.(null)}
      className={`flex flex-col gap-3 rounded-lg border bg-card p-4 transition-colors ${
        active ? "border-primary" : "border-line hover:border-line-strong"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary font-mono text-[12px] font-bold text-white">
            {index + 1}
          </span>
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-[14px] font-semibold tracking-tight">
              {business.name}
              {business.dataOrigin === "demo" && <DemoBadge />}
            </h3>
            <p className="mt-0.5 text-[12px] text-ink-2">{business.category}</p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded bg-sunken px-2 py-0.5 font-mono text-[12px]">
          <Icon name="map-pin" size={13} className="text-primary" />
          {business.distanceKm.toFixed(1)} km from center
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 rounded bg-sunken/70 p-2.5 sm:grid-cols-2">
        <Availability label="Website" icon="globe" value={business.website} />
        <Availability label="Phone" icon="phone" value={business.phone} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-2.5">
        <ProvenanceBadge label={business.sourceLabel} />
        <div className="flex items-center gap-2">
          <Button
            variant={saved ? "primary" : "secondary"}
            className="h-7 px-2.5 text-[12px]"
            aria-pressed={saved}
            onClick={() => onToggleSave?.(business.id)}
          >
            <Icon name={saved ? "check" : "bookmark"} size={13} />
            {saved ? "Saved" : "Save lead"}
          </Button>
          <Link
            href={`/leads/${business.leadId}`}
            className="inline-flex h-7 items-center gap-1 rounded border border-line bg-card px-2.5 text-[12px] font-semibold text-ink hover:border-primary hover:bg-stone"
          >
            Inspect details
            <Icon name="chevron-right" size={13} />
          </Link>
        </div>
      </div>
    </article>
  );
}
