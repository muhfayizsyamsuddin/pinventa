/**
 * Maps Pinventa industry ids to OpenStreetMap `office=*` values.
 *
 * The values were chosen from the `office` categories observed in the earlier
 * Overpass validation (docs/validation/raw/overpass_targeted_3km.json, see
 * docs/VALIDATION_LOG.md V1): insurance, consulting, architect,
 * employment_agency, it, lawyer, financial, accountant, web_design, software,
 * advertising_agency. Extra standard values (tax_advisor, notary,
 * financial_advisor) are added for the narrower industries. The mapping is a
 * relevance heuristic, not a guarantee that a record is a good prospect.
 *
 * Every query requires an industry; there is no "all offices" fallback.
 */
export const INDUSTRY_TAGS: Record<string, string[]> = {
  professional: [
    "accountant",
    "tax_advisor",
    "lawyer",
    "notary",
    "consulting",
    "financial",
    "financial_advisor",
    "insurance",
    "it",
    "software",
    "web_design",
    "advertising_agency",
    "architect",
    "employment_agency",
  ],
  accounting: ["accountant", "tax_advisor"],
  consulting: ["consulting"],
  legal: ["lawyer", "notary"],
  financial: ["financial", "financial_advisor", "insurance"],
  it: ["it", "software", "web_design"],
};

/** Human labels for `office=*` values shown as the business category. */
export const OFFICE_LABELS: Record<string, string> = {
  accountant: "Accounting",
  tax_advisor: "Tax advisory",
  lawyer: "Legal services",
  notary: "Notary",
  consulting: "Consulting",
  financial: "Financial services",
  financial_advisor: "Financial advisory",
  insurance: "Insurance",
  it: "IT services",
  software: "Software",
  web_design: "Web design",
  advertising_agency: "Advertising agency",
  architect: "Architecture",
  employment_agency: "Employment agency",
};
