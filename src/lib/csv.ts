import type { Lead } from "@/types/pinventa";
import { componentPoints, priorityBand, totalScore } from "@/lib/scoring";

const COLUMNS = [
  "lead_ref",
  "name",
  "category",
  "area",
  "distance_km",
  "website_listed",
  "phone_listed",
  "email_ready",
  "status",
  "score_total",
  "score_fit",
  "score_opportunity",
  "score_contact",
  "score_quality",
  "priority_band",
  "source",
  "data_origin",
] as const;

/** Quote a CSV cell and neutralise spreadsheet formula injection. */
function cell(value: string | number | boolean): string {
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function leadsToCsv(leads: Lead[]): string {
  const rows = leads.map((lead) => {
    const hasScores = lead.components.length > 0;
    const total = hasScores ? totalScore(lead.components) : "unscored";
    const points = Object.fromEntries(
      lead.components.map((c) => [c.key, componentPoints(c).toFixed(1)]),
    );
    return [
      lead.refId,
      lead.name,
      lead.category,
      lead.area,
      lead.distanceKm,
      lead.website === "listed",
      lead.phone === "listed",
      lead.emailReady,
      lead.status,
      total,
      points.fit ?? "—",
      points.opportunity ?? "—",
      points.contact ?? "—",
      points.quality ?? "—",
      hasScores ? priorityBand(typeof total === "number" ? total : 0) : "unscored",
      lead.sourceLabel,
      lead.dataOrigin,
    ]
      .map(cell)
      .join(",");
  });
  return [COLUMNS.join(","), ...rows].join("\r\n");
}
