/**
 * Browser-side lead persistence using localStorage.
 *
 * LIMITATION: Data is stored only in the current browser (tab + origin).
 * It is NOT persisted to a server, NOT shared between devices, and is lost
 * if the user clears browser storage or uses a private/incognito session.
 * This is a temporary mechanism for the MVP hackathon prototype.
 * The implementation plan calls for Supabase PostgreSQL as the production
 * store (see docs/IMPLEMENTATION_PLAN.md §4).
 */

import type {
  BusinessResult,
  Lead,
  LeadStatus,
  LeadStatusEvent,
  ObservedFact,
} from "@/types/pinventa";

export const LEAD_STORE_KEY = "pinventa:saved_leads_v1";
export const LAST_SCORED_LEAD_KEY = "pinventa:last_scored_lead_id";

export function setLastScoredLeadId(leadId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LAST_SCORED_LEAD_KEY, leadId);
  } catch {}
}

export function getLastScoredLeadId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(LAST_SCORED_LEAD_KEY);
  } catch {
    return null;
  }
}

/** Derive a short, human-readable reference ID from an OSM business id. */
function osmRefId(osmId: string): string {
  // "osm-node-2674325204" → "OSM-N2674325204"
  // "osm-way-123456"      → "OSM-W123456"
  // "osm-relation-789"    → "OSM-R789"
  const parts = osmId.split("-");
  if (parts.length >= 3) {
    const typeCode = parts[1].charAt(0).toUpperCase(); // N / W / R
    return `OSM-${typeCode}${parts[2]}`;
  }
  return `OSM-${osmId}`;
}

/**
 * Determines the initial review status for a live OSM lead.
 *
 * Per PRD §5, `needs_verification` means the lead has no independently verified
 * work email. An OSM `email` tag confirms only that an email is listed in OSM;
 * it does not prove deliverability. This status alone does not determine
 * Criterion 4 readiness: evaluateLeadReviewReadiness() checks the record's
 * category, location, source traceability, contact presence, and identity ambiguity.
 * Live leads are not promoted to `qualified` automatically.
 */
function initialStatus(): LeadStatus {
  return "discovered";
}

export interface LeadReviewReadiness {
  /** True if this lead satisfies all data completeness rules to be considered review-ready for Criterion 4 */
  isReviewReady: boolean;
  /** Detailed breakdown of rules evaluated */
  checks: {
    /** True if the record has an identified commercial category */
    hasCategory: boolean;
    /** True if the record has adequate location info (address or valid distance/coordinates) */
    hasLocation: boolean;
    /** True if the record has a traceable OpenStreetMap source link */
    hasTraceableSource: boolean;
    /** True if at least one digital presence channel (website, phone, email) is recorded in source */
    hasDigitalPresence: boolean;
    /** True when the name looks building-related and the category is generic or missing */
    isBuildingOrFacility: boolean;
  };
  /** Summary of why the lead is or is not review-ready */
  reasons: string[];
}

const BUILDING_CENTRE_REGEX =
  /\b(centre|center|building|tower|towers|plaza|complex|house|hub)\b/i;

const GENERIC_CATEGORIES = new Set([
  "office",
  "building",
  "commercial",
  "commercial building",
  "place",
  "establishment",
]);

/**
 * Evaluates whether a lead satisfies MVP Criterion 4 rules:
 * - Clear business identity (operating enterprise vs generic building/centre)
 * - Identified category
 * - Verifiable OpenStreetMap source reference
 * - Adequate location
 * - At least one listed digital/contact channel
 *
 * NOTE: The presence of contact details in OpenStreetMap indicates listing in a
 * public source, NOT an independent verification of deliverability or identity.
 */
export function evaluateLeadReviewReadiness(lead: Lead): LeadReviewReadiness {
  const reasons: string[] = [];

  const normalizedCategory = lead.category?.trim().toLowerCase() ?? "";
  const hasCategory = Boolean(
    normalizedCategory &&
    !GENERIC_CATEGORIES.has(normalizedCategory) &&
    !BUILDING_CENTRE_REGEX.test(normalizedCategory),
  );
  if (!hasCategory) {
    reasons.push("No specific commercial category listed in source record");
  }

  const hasLocation = Boolean(
    (lead.area && lead.area !== "Address not listed in source") ||
    (Number.isFinite(lead.distanceKm) && lead.distanceKm >= 0),
  );
  if (!hasLocation) {
    reasons.push("Inadequate location details in source record");
  }

  const hasTraceableSource = Boolean(
    lead.osmUrl || (lead.sourceLabel && lead.sourceLabel.includes("OpenStreetMap")),
  );
  if (!hasTraceableSource) {
    reasons.push("Missing traceable OpenStreetMap source reference");
  }

  const hasDigitalPresence = Boolean(
    lead.website === "listed" ||
    lead.phone === "listed" ||
    lead.email ||
    lead.websiteUrl ||
    lead.phoneNumber,
  );
  if (!hasDigitalPresence) {
    reasons.push(
      "No digital presence (website, phone, or email) listed in OpenStreetMap source",
    );
  }

  // A building-like word in the name is only a hint, not proof that the record
  // represents a property. Flag it only when the OSM category is also generic,
  // missing, or itself describes a facility. A specific commercial category such
  // as "Insurance" must not be overridden by the name alone.
  const categorySuggestsBuilding =
    !normalizedCategory ||
    GENERIC_CATEGORIES.has(normalizedCategory) ||
    BUILDING_CENTRE_REGEX.test(normalizedCategory);
  const nameSuggestsBuilding = BUILDING_CENTRE_REGEX.test(lead.name);
  const isBuildingOrFacility = nameSuggestsBuilding && categorySuggestsBuilding;

  if (isBuildingOrFacility) {
    reasons.push(
      "Business identity needs clarification: the name resembles a building or property centre and the source category is generic or missing. Confirm the operating company or tenant before treating this record as a sales prospect.",
    );
  }

  const isReviewReady =
    hasCategory &&
    hasLocation &&
    hasTraceableSource &&
    hasDigitalPresence &&
    !isBuildingOrFacility;

  return {
    isReviewReady,
    checks: {
      hasCategory,
      hasLocation,
      hasTraceableSource,
      hasDigitalPresence,
      isBuildingOrFacility,
    },
    reasons,
  };
}

/** Convert a live BusinessResult (from Discover) into a Lead for storage. */
export function businessToLead(b: BusinessResult): Lead {
  const createdAt = new Date().toISOString();
  const facts: ObservedFact[] = [
    {
      label: "Business name",
      value: b.name,
      tag: "OpenStreetMap",
    },
    {
      label: "Category (OSM tag)",
      value: b.category,
      tag: "OpenStreetMap",
    },
    {
      label: "Address",
      value: b.address ?? null,
      tag: b.address ? "OpenStreetMap" : undefined,
    },
    {
      label: "Coordinates",
      value:
        b.lat != null && b.lng != null
          ? `${b.lat.toFixed(6)}, ${b.lng.toFixed(6)}`
          : null,
      tag: b.lat != null ? "OpenStreetMap" : undefined,
    },
    {
      label: "Website",
      value: b.websiteUrl ?? null,
      tag: b.websiteUrl
        ? "OpenStreetMap — presence in OSM is not an independent verification"
        : undefined,
    },
    {
      label: "Phone",
      value: b.phoneNumber ?? null,
      tag: b.phoneNumber
        ? "OpenStreetMap — presence in OSM is not an independent verification"
        : undefined,
    },
    {
      label: "Email",
      value: b.email ?? null,
      tag: b.email
        ? "OpenStreetMap — listed in source; deliverability not confirmed"
        : undefined,
    },
    {
      label: "OpenStreetMap source",
      value: b.osmUrl ?? null,
      tag: "Source reference",
    },
    {
      label: "Distance from search center",
      value: Number.isFinite(b.distanceKm) ? `${b.distanceKm.toFixed(2)} km` : null,
      tag: "Computed from geocoded center",
    },
    {
      label: "Decision maker",
      value: null,
      tag: undefined,
    },
  ];

  return {
    id: b.id,
    refId: osmRefId(b.id),
    name: b.name,
    category: b.category,
    /**
     * OSM does not distinguish subcategory; use the same value as category.
     * A future enrichment step (website scraping, manual research) would
     * populate a more specific subcategory.
     */
    subcategory: b.category,
    area: b.address ?? "Address not listed in source",
    distanceKm: Number.isFinite(b.distanceKm) ? b.distanceKm : 0,
    website: b.website,
    phone: b.phone,
    /**
     * emailReady = false for all OSM-sourced leads.
     * Rationale: OSM email tag = "listed in one public source", not a verified
     * business email. Per PRD §5, "verified" requires independent source_url
     * traceability beyond the OSM tag. Deliverability testing is out of scope.
     */
    emailReady: false,
    status: initialStatus(),
    statusUpdatedAt: createdAt,
    statusHistory: [
      {
        from: null,
        to: "discovered",
        changedAt: createdAt,
        source: "discovery",
      },
    ],
    /**
     * components = []: AI scoring (LLM sub-scores for Fit, Opportunity,
     * Contact Readiness, Data Quality) is not yet implemented.
     * Scoring requires the n8n + OpenRouter integration planned for a later
     * milestone (see docs/IMPLEMENTATION_PLAN.md §5 Fase 2).
     * An empty array is displayed as "Not yet scored" in the UI.
     */
    components: [],
    facts,
    /**
     * hypotheses = []: analytical hypotheses are generated by the AI Agent
     * in a later milestone. No hypotheses are inferred from OSM tags alone.
     */
    hypotheses: [],
    sourceLabel: b.sourceLabel,
    dataOrigin: "live",
    osmUrl: b.osmUrl,
    completeness: b.completeness,
    email: b.email,
    websiteUrl: b.websiteUrl,
    phoneNumber: b.phoneNumber,
  };
}

const EMPTY_LEADS: Lead[] = [];

let inMemoryLeads: Lead[] = EMPTY_LEADS;
let isStoreHydrated = false;
const listeners = new Set<() => void>();

export function subscribeLeadStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyLeadStore(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function getLeadsSnapshot(): Lead[] {
  return inMemoryLeads;
}

export function getServerLeadsSnapshot(): Lead[] {
  return EMPTY_LEADS;
}

export function getHydratedSnapshot(): boolean {
  return isStoreHydrated;
}

export function getServerHydratedSnapshot(): boolean {
  return false;
}

/**
 * Hydrates the in-memory lead store from localStorage.
 * Must only be called after initial client hydration (e.g. inside useEffect)
 * to ensure deterministic, hydration-safe initial rendering.
 */
export function hydrateLeadStore(): void {
  if (typeof window === "undefined") return;
  if (isStoreHydrated) return;
  inMemoryLeads = readLeads();
  isStoreHydrated = true;
  notifyLeadStore();
}

/** Read all saved live leads from localStorage. Returns [] when unavailable. */
export function readLeads(): Lead[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LEAD_STORE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Lead[];
  } catch {
    return [];
  }
}

/** Overwrite the stored lead list. No-op when running server-side. */
export function writeLeads(leads: Lead[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LEAD_STORE_KEY, JSON.stringify(leads));
  } catch {
    // Quota exceeded or storage unavailable — silently fail.
  }
}

/**
 * Add a lead to storage.
 * Deduplication: if a lead with the same `id` already exists it is skipped.
 * Returns the updated list (whether or not a new record was added).
 */
export function addLeadToStore(lead: Lead): Lead[] {
  const existing = isStoreHydrated ? inMemoryLeads : readLeads();
  if (existing.some((l) => l.id === lead.id)) return existing;
  const updated = [...existing, lead];
  inMemoryLeads = updated;
  isStoreHydrated = true;
  writeLeads(updated);
  notifyLeadStore();
  return updated;
}

/** Remove a lead by id. Returns the updated list. */
export function removeLeadFromStore(id: string): Lead[] {
  const existing = isStoreHydrated ? inMemoryLeads : readLeads();
  const updated = existing.filter((l) => l.id !== id);
  inMemoryLeads = updated;
  isStoreHydrated = true;
  writeLeads(updated);
  notifyLeadStore();
  return updated;
}


/** Update a saved lead and record changes to its workflow status. */
export function updateLeadInStore(
  id: string,
  patch: Partial<Lead>,
): Lead[] {
  const existing = isStoreHydrated ? inMemoryLeads : readLeads();

  const updated = existing.map((lead) => {
    if (lead.id !== id) return lead;

    const statusChanged =
      patch.status !== undefined && patch.status !== lead.status;

    if (!statusChanged || patch.status === undefined) {
      return { ...lead, ...patch };
    }

    const changedAt = new Date().toISOString();

    const event: LeadStatusEvent = {
      from: lead.status,
      to: patch.status,
      changedAt,
      source: "manual",
    };

    return {
      ...lead,
      ...patch,
      statusUpdatedAt: changedAt,
      statusHistory: [...(lead.statusHistory ?? []), event],
    };
  });

  inMemoryLeads = updated;
  isStoreHydrated = true;
  writeLeads(updated);
  notifyLeadStore();

  return updated;
}

// Cross-tab synchronization
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === LEAD_STORE_KEY) {
      inMemoryLeads = readLeads();
      isStoreHydrated = true;
      notifyLeadStore();
    }
  });
}
