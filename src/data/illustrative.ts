/**
 * ILLUSTRATIVE DATA ONLY — every record here is a made-up placeholder used to
 * show layouts. None of it comes from OpenStreetMap, Overpass, a website, or
 * any business. It must always be rendered with a "demo" label and must never
 * be mixed with live results or exported as live data.
 */
import { makeComponent } from "@/lib/config";
import type { BusinessResult, Lead, OutreachDraft } from "@/types/pinventa";

export const DEMO_NOTICE_TEXT = "Illustrative preview — not live data.";
export const DEMO_SOURCE_LABEL = "Illustrative sample (no live source)";

export const DEMO_BUSINESSES: BusinessResult[] = [
  {
    id: "example",
    leadId: "example",
    name: "Example Business A",
    category: "Management consulting & advisory",
    area: "Placeholder area",
    distanceKm: 0.4,
    website: "listed",
    phone: "listed",
    sourceLabel: DEMO_SOURCE_LABEL,
    pin: { x: 53, y: 48 },
    dataOrigin: "demo",
  },
  {
    id: "example-b",
    leadId: "example-b",
    name: "Example Business B",
    category: "Corporate legal & compliance services",
    area: "Placeholder area",
    distanceKm: 1.1,
    website: "listed",
    phone: "not_listed",
    sourceLabel: DEMO_SOURCE_LABEL,
    pin: { x: 44, y: 36 },
    dataOrigin: "demo",
  },
  {
    id: "example-c",
    leadId: "example-c",
    name: "Example Business C",
    category: "Executive search & staffing",
    area: "Placeholder area",
    distanceKm: 2.2,
    website: "not_listed",
    phone: "listed",
    sourceLabel: DEMO_SOURCE_LABEL,
    pin: { x: 36, y: 66 },
    dataOrigin: "demo",
  },
];

export const DEMO_LEADS: Lead[] = [
  {
    id: "example",
    refId: "DEMO-001",
    name: "Example Business A",
    category: "Management consulting & advisory",
    subcategory: "Strategic advisory",
    area: "Placeholder area",
    distanceKm: 0.4,
    website: "listed",
    phone: "listed",
    emailReady: false,
    status: "qualified",
    sourceLabel: DEMO_SOURCE_LABEL,
    dataOrigin: "demo",
    components: [
      makeComponent("fit", 83, "Category matches the professional-services target in this sample."),
      makeComponent("opportunity", 80, "Sample hypothesis only: a website and phone are listed, so a digital review would be possible."),
      makeComponent("contact", 72, "General phone listed; no verified work email and no named decision maker."),
      makeComponent("quality", 75, "Single illustrative source; nothing has been independently verified."),
    ],
    facts: [
      { label: "Business name", value: "Example Business A", tag: "Placeholder" },
      { label: "Listed website", value: "example.invalid", tag: "Placeholder domain" },
      { label: "Listed telephone", value: "+65 XXXX XXXX", tag: "Placeholder number" },
      { label: "Business email", value: null, tag: "Not listed" },
      { label: "Decision maker", value: null, tag: "Not listed" },
    ],
    hypotheses: [
      {
        id: "h1",
        kindLabel: "Workflow opportunity",
        title: "Possible proposal and client-intake automation",
        body: "Firms in this category may handle client enquiries manually. This is a hypothesis to test in a discovery call, not an observation about this business.",
        basis: "Basis: business category only. No website review has been performed.",
      },
      {
        id: "h2",
        kindLabel: "Service positioning",
        title: "Possible fit for workflow automation or an AI sales assistant",
        body: "Suggested only because a website is listed in the sample record. It must be checked against the real site before use.",
        basis: "Basis: presence of a listed website. Content not reviewed.",
      },
    ],
  },
  {
    id: "example-b",
    refId: "DEMO-002",
    name: "Example Business B",
    category: "Corporate legal & compliance services",
    subcategory: "Regulatory & filing",
    area: "Placeholder area",
    distanceKm: 1.1,
    website: "listed",
    phone: "not_listed",
    emailReady: false,
    status: "researching",
    sourceLabel: DEMO_SOURCE_LABEL,
    dataOrigin: "demo",
    components: [
      makeComponent("fit", 70, "Category is adjacent to the target industry in this sample."),
      makeComponent("opportunity", 62, "Weak signal: only a website is listed."),
      makeComponent("contact", 48, "No phone or email listed in the sample record."),
      makeComponent("quality", 60, "Single illustrative source."),
    ],
    facts: [
      { label: "Business name", value: "Example Business B", tag: "Placeholder" },
      { label: "Listed website", value: "example.invalid", tag: "Placeholder domain" },
      { label: "Listed telephone", value: null, tag: "Not listed" },
      { label: "Business email", value: null, tag: "Not listed" },
    ],
    hypotheses: [
      {
        id: "h1",
        kindLabel: "Digital presence",
        title: "Possible website or enquiry-form review",
        body: "A review of the live website would be needed before saying anything about its quality.",
        basis: "Basis: a website is listed. Content not reviewed.",
      },
    ],
  },
  {
    id: "example-c",
    refId: "DEMO-003",
    name: "Example Business C",
    category: "Executive search & staffing",
    subcategory: "Recruitment services",
    area: "Placeholder area",
    distanceKm: 2.2,
    website: "not_listed",
    phone: "listed",
    emailReady: false,
    status: "needs_verification",
    sourceLabel: DEMO_SOURCE_LABEL,
    dataOrigin: "demo",
    components: [
      makeComponent("fit", 62, "Category partly fits the target industry in this sample."),
      makeComponent("opportunity", 56, "No website listed; a digital-presence gap would need to be confirmed by search."),
      makeComponent("contact", 44, "Phone only; no verified work email."),
      makeComponent("quality", 50, "Sparse record from a single illustrative source."),
    ],
    facts: [
      { label: "Business name", value: "Example Business C", tag: "Placeholder" },
      { label: "Listed website", value: null, tag: "Not listed" },
      { label: "Listed telephone", value: "+65 XXXX XXXX", tag: "Placeholder number" },
      { label: "Business email", value: null, tag: "Not listed" },
    ],
    hypotheses: [
      {
        id: "h1",
        kindLabel: "Digital presence",
        title: "Possible website development need",
        body: "No official website was found in this sample record. Confirm with a search before treating it as a gap.",
        basis: "Basis: absence of a listed website in one source only.",
      },
    ],
  },
];

export function findDemoLead(id: string): Lead | undefined {
  return DEMO_LEADS.find((lead) => lead.id === id);
}

const CLOSING = "Best regards,\n[Your name]\nMAXY Singapore";

export const DEMO_DRAFTS: OutreachDraft[] = [
  {
    id: "draft-a",
    leadId: "example",
    title: "Draft A — Operational efficiency",
    summary: "Client intake and proposal workflow",
    subject: "Idea for client intake at [Company name]",
    body: `Hello [Contact name],\n\n[Personalized opening — cite one verified fact about the business here.]\n\nObserved gap: [only a gap supported by a source reference].\n\nMAXY helps professional services teams reduce manual intake and proposal work with workflow automation.\n\nWould you be open to a 10–15 minute discovery call next week?\n\n${CLOSING}`,
    status: "in_review",
    dataOrigin: "demo",
  },
  {
    id: "draft-b",
    leadId: "example",
    title: "Draft B — Digital presence",
    summary: "Website and enquiry experience",
    subject: "A quick note on [Company name]'s website",
    body: `Hello [Contact name],\n\n[Personalized opening — cite one verified fact about the business here.]\n\nObserved gap: [only a gap supported by a source reference, e.g. no enquiry form found on the site].\n\nMAXY supports website revamp and digital growth for professional firms.\n\nCould we arrange a 10–15 minute discovery call?\n\n${CLOSING}`,
    status: "draft",
    dataOrigin: "demo",
  },
  {
    id: "draft-c",
    leadId: "example",
    title: "Draft C — AI assistant",
    summary: "Enquiry handling with an AI assistant",
    subject: "Handling enquiries faster at [Company name]",
    body: `Hello [Contact name],\n\n[Personalized opening — cite one verified fact about the business here.]\n\nObserved opportunity: [only an opportunity supported by a source reference].\n\nMAXY builds AI customer-support and sales assistants that hand over to your team.\n\nWould a 10–15 minute discovery call make sense?\n\n${CLOSING}`,
    status: "draft",
    dataOrigin: "demo",
  },
];
