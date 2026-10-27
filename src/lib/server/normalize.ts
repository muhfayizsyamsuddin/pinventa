import { OFFICE_LABELS } from "@/lib/server/industries";
import type { OsmElement } from "@/lib/server/overpass";
import { haversineKm } from "@/lib/server/util";
import type { BusinessResult, DataCompleteness } from "@/types/pinventa";


const DUPLICATE_DISTANCE_KM = 0.15;

function clean(value: string | undefined): string | undefined {
  const v = value?.trim();
  return v ? v : undefined;
}

function firstTag(tags: Record<string, string>, keys: string[]): string | undefined {
  for (const key of keys) {
    const v = clean(tags[key]);
    if (v) return v;
  }
  return undefined;
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(pte\.?|ltd\.?|llp|llc|inc\.?|limited|private|co\.?|singapore)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function toTitle(value: string): string {
  return value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

function buildAddress(tags: Record<string, string>): string | undefined {
  const full = clean(tags["addr:full"]);
  if (full) return full;
  const street = [clean(tags["addr:housenumber"]), clean(tags["addr:street"])].filter(Boolean).join(" ");
  const unit = clean(tags["addr:unit"]);
  const place = [clean(tags["addr:city"]), clean(tags["addr:postcode"])].filter(Boolean).join(" ");
  const parts = [street, unit ? `#${unit.replace(/^#/, "")}` : undefined, place].filter(Boolean);
  return parts.length ? parts.join(", ") : undefined;
}

function validWebsite(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const candidate = /^https?:\/\//i.test(value) ? value : /^[\w-]+(\.[\w-]+)+(\/|$)/.test(value) ? `https://${value}` : "";
  if (!candidate) return undefined;
  try {
    const u = new URL(candidate);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

function completenessOf(b: Pick<BusinessResult, "address" | "websiteUrl" | "phoneNumber" | "email">): DataCompleteness {
  const hasContact = Boolean(b.websiteUrl || b.phoneNumber || b.email);
  if (b.address && hasContact) return "good";
  if (b.address || hasContact) return "partial";
  return "minimal";
}

export function normalizeElement(el: OsmElement, center: { lat: number; lng: number }): BusinessResult | null {
  const tags = el.tags ?? {};
  const name = clean(tags.name);
  if (!name) return null; // never invent a name

  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  const hasCoords = typeof lat === "number" && typeof lng === "number";

  const websiteUrl = validWebsite(firstTag(tags, ["website", "contact:website", "url"]));
  const phoneNumber = firstTag(tags, ["phone", "contact:phone"]);
  const email = firstTag(tags, ["email", "contact:email"]);
  const address = buildAddress(tags);
  const office = clean(tags.office);
  const category = office ? (OFFICE_LABELS[office] ?? toTitle(office)) : "Office";
  const osmRef = `${el.type}/${el.id}`;

  const business: BusinessResult = {
    id: `osm-${el.type}-${el.id}`,
    name,
    category,
    area: address ?? "Address not listed in source",
    distanceKm: hasCoords ? haversineKm(center.lat, center.lng, lat, lng) : Number.NaN,
    website: websiteUrl ? "listed" : "not_listed",
    phone: phoneNumber ? "listed" : "not_listed",
    sourceLabel: `OpenStreetMap · ${osmRef}`,
    dataOrigin: "live",
    lat: hasCoords ? lat : undefined,
    lng: hasCoords ? lng : undefined,
    address,
    websiteUrl,
    phoneNumber,
    email,
    osmUrl: `https://www.openstreetmap.org/${osmRef}`,
  };
  business.completeness = completenessOf(business);
  return business;
}

const SCORE = (b: BusinessResult) =>
  (b.address ? 1 : 0) + (b.websiteUrl ? 1 : 0) + (b.phoneNumber ? 1 : 0) + (b.email ? 1 : 0);

function isDuplicate(a: BusinessResult, b: BusinessResult): boolean {
  if (a.id === b.id) return true;

  const nameA = normalizeName(a.name);
  const nameB = normalizeName(b.name);

  // Do not deduplicate unrelated records using an empty normalized name.
  if (!nameA || !nameB || nameA !== nameB) return false;

  if (
    a.lat !== undefined &&
    a.lng !== undefined &&
    b.lat !== undefined &&
    b.lng !== undefined
  ) {
    if (
      haversineKm(a.lat, a.lng, b.lat, b.lng) <=
      DUPLICATE_DISTANCE_KM
    ) {
      return true;
    }
  }

  return Boolean(a.address && b.address && a.address === b.address);
}

export interface NormalizeOutput {
  businesses: BusinessResult[];
  skippedUnnamed: number;
  duplicatesMerged: number;
}

/** Normalizes, drops unnamed elements, merges clear duplicates, sorts by distance. */
export function normalizeAll(
  elements: OsmElement[],
  center: { lat: number; lng: number },
  radiusKm: number,
): NormalizeOutput {
  let skippedUnnamed = 0;
  let duplicatesMerged = 0;
  const kept: BusinessResult[] = [];

  for (const el of elements) {
    const b = normalizeElement(el, center);

    if (!b) {
      skippedUnnamed++;
      continue;
    }

    // Exclude records without usable coordinates and records
    // whose representative coordinates fall outside the radius.
    if (!Number.isFinite(b.distanceKm) || b.distanceKm > radiusKm) {
      continue;
    }
    const idx = kept.findIndex((k) => isDuplicate(k, b));
    if (idx === -1) {
      kept.push(b);
      continue;
    }
    duplicatesMerged++;
    // Keep the record with more listed detail; fill gaps from the other without inventing data.
    const [keep, other] = SCORE(b) > SCORE(kept[idx]) ? [b, kept[idx]] : [kept[idx], b];
    keep.address ??= other.address;
    keep.websiteUrl ??= other.websiteUrl;
    keep.phoneNumber ??= other.phoneNumber;
    keep.email ??= other.email;
    keep.website = keep.websiteUrl ? "listed" : "not_listed";
    keep.phone = keep.phoneNumber ? "listed" : "not_listed";
    keep.area = keep.address ?? "Address not listed in source";
    keep.completeness = completenessOf(keep);
    kept[idx] = keep;
  }

  kept.sort((a, b) => {
    const da = Number.isNaN(a.distanceKm) ? Infinity : a.distanceKm;
    const db = Number.isNaN(b.distanceKm) ? Infinity : b.distanceKm;
    return da - db;
  });
  return { businesses: kept, skippedUnnamed, duplicatesMerged };
}
