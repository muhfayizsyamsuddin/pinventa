import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { DemoBadge, ProvenanceBadge } from "@/components/ui/StatusBadge";
import { Icon } from "@/components/ui/Icon";
import type { BusinessResult, DataCompleteness, FieldAvailability } from "@/types/pinventa";

function Availability({
  label,
  icon,
  value,
  detail,
  href,
}: {
  label: string;
  icon: "globe" | "phone" | "mail";
  value: FieldAvailability;
  /** Exact value from the source record (live data). */
  detail?: string;
  href?: string;
}) {
  const listed = value === "listed";
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Icon name={listed ? icon : "dash-circle"} size={15} className={listed ? "shrink-0 text-sage" : "shrink-0 text-ink-3"} />
      <span className="label-caps">{label}</span>
      {listed && detail && href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 truncate text-[12px] text-primary-press underline-offset-2 hover:underline"
        >
          {detail}
        </a>
      ) : (
        <span
          className={
            listed
              ? "min-w-0 truncate text-[12px] text-ink"
              : "text-[12px] italic text-ink-3"
          }
        >
          {listed ? (detail ?? "Listed in record") : "Not listed in source"}
        </span>
      )}
    </div>
  );
}

const COMPLETENESS_LABEL: Record<DataCompleteness, string> = {
  good: "Address + contact listed",
  partial: "Partial details",
  minimal: "Name and location only",
};

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
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
  const live = business.dataOrigin === "live";
  const hasDistance = Number.isFinite(business.distanceKm);
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
            <h3 className="flex flex-wrap items-center gap-2 text-[14px] font-semibold tracking-tight">
              {business.name}
              {business.dataOrigin === "demo" && <DemoBadge />}
            </h3>
            <p className="mt-0.5 text-[12px] text-ink-2">{business.category}</p>
            {live && (
              <p className={business.address ? "mt-0.5 text-[12px] text-ink-2" : "mt-0.5 text-[12px] italic text-ink-3"}>
                {business.address ?? "Address not listed in source"}
              </p>
            )}
          </div>
        </div>
        {hasDistance && (
          <span className="flex shrink-0 items-center gap-1 rounded bg-sunken px-2 py-0.5 font-mono text-[12px]">
            <Icon name="map-pin" size={13} className="text-primary" />
            {business.distanceKm.toFixed(1)} km from center
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 rounded bg-sunken/70 p-2.5 sm:grid-cols-2">
        <Availability
          label="Website"
          icon="globe"
          value={business.website}
          detail={business.websiteUrl ? hostOf(business.websiteUrl) : undefined}
          href={business.websiteUrl}
        />
        <Availability label="Phone" icon="phone" value={business.phone} detail={business.phoneNumber} />
        {live && (
          <Availability
            label="Email"
            icon="mail"
            value={business.email ? "listed" : "not_listed"}
            detail={business.email}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {business.osmUrl ? (
            <a
              href={business.osmUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View ${business.name} on OpenStreetMap (opens in a new tab)`}
              className="hover:opacity-80"
            >
              <ProvenanceBadge label={`${business.sourceLabel} ↗`} />
            </a>
          ) : (
            <ProvenanceBadge label={business.sourceLabel} />
          )}
          {business.completeness && (
            <span title="How much of the expected detail the OpenStreetMap record lists. Not a verification of the business.">
              <ProvenanceBadge label={COMPLETENESS_LABEL[business.completeness]} />
            </span>
          )}
        </div>
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
          {business.leadId && (
            <Link
              href={`/leads/${business.leadId}`}
              className="inline-flex h-7 items-center gap-1 rounded border border-line bg-card px-2.5 text-[12px] font-semibold text-ink hover:border-primary hover:bg-stone"
            >
              Inspect details
              <Icon name="chevron-right" size={13} />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
