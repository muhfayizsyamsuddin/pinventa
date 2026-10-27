import assert from "node:assert";

// 1. Verify weights
const SCORE_META = {
  fit: { label: "Industry & Customer Fit", weightPct: 30 },
  opportunity: { label: "Identifiable Digital / AI Opportunity", weightPct: 25 },
  contact: { label: "Contact Readiness", weightPct: 25 },
  quality: { label: "Data Quality & Evidence Confidence", weightPct: 20 },
};

const totalWeight = Object.values(SCORE_META).reduce((sum, item) => sum + item.weightPct, 0);
assert.strictEqual(totalWeight, 100, "Weights must sum to exactly 100%");
console.log("✓ Weight check: 30% + 25% + 25% + 20% = 100%");

// 2. Deterministic total score formula
function totalScore(fit, opp, contact, quality) {
  const weighted =
    fit * (SCORE_META.fit.weightPct / 100) +
    opp * (SCORE_META.opportunity.weightPct / 100) +
    contact * (SCORE_META.contact.weightPct / 100) +
    quality * (SCORE_META.quality.weightPct / 100);
  return Math.round(weighted);
}

function priorityBand(total) {
  if (total >= 80) return "high";
  if (total >= 60) return "medium";
  return "low";
}

const PRIORITY_LABEL = {
  high: "High-Priority Prospect",
  medium: "Medium-Priority Prospect",
  low: "Low-Priority / Requires Research",
};

// Test boundary values
assert.strictEqual(priorityBand(100), "high");
assert.strictEqual(priorityBand(80), "high");
assert.strictEqual(PRIORITY_LABEL[priorityBand(80)], "High-Priority Prospect");

assert.strictEqual(priorityBand(79), "medium");
assert.strictEqual(PRIORITY_LABEL[priorityBand(79)], "Medium-Priority Prospect");

assert.strictEqual(priorityBand(60), "medium");
assert.strictEqual(PRIORITY_LABEL[priorityBand(60)], "Medium-Priority Prospect");

assert.strictEqual(priorityBand(59), "low");
assert.strictEqual(PRIORITY_LABEL[priorityBand(59)], "Low-Priority / Requires Research");

assert.strictEqual(priorityBand(0), "low");
console.log("✓ Boundary category checks passed (exact 80, 79, 60, 59)");

// Test formula combinations
// Exact 80
assert.strictEqual(totalScore(80, 80, 80, 80), 80);

// Rounding check: (85 * 0.3) + (75 * 0.25) + (80 * 0.25) + (70 * 0.2) = 25.5 + 18.75 + 20 + 14 = 78.25 -> 78
assert.strictEqual(totalScore(85, 75, 80, 70), 78);
assert.strictEqual(priorityBand(78), "medium");

// Exact 60: (60 * 0.3) + (60 * 0.25) + (60 * 0.25) + (60 * 0.2) = 18 + 15 + 15 + 12 = 60
assert.strictEqual(totalScore(60, 60, 60, 60), 60);
assert.strictEqual(priorityBand(60), "medium");

// Under 60: (50 * 0.3) + (60 * 0.25) + (40 * 0.25) + (70 * 0.2) = 15 + 15 + 10 + 14 = 54
assert.strictEqual(totalScore(50, 60, 40, 70), 54);
assert.strictEqual(priorityBand(54), "low");

console.log("✓ Formula arithmetic and deterministic rounding checks passed");

// 3. Schema validation and clamping simulation
function validateAndClamp(raw) {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  const parsed = JSON.parse(cleaned);
  const keys = ["fit", "opportunity", "contact", "quality"];
  const components = [];
  for (const k of keys) {
    if (!parsed[k]) throw new Error(`Missing pillar ${k}`);
    const rawScore = Number(parsed[k].score);
    if (!Number.isFinite(rawScore)) throw new Error(`Non-numeric score for ${k}`);
    const score = Math.max(0, Math.min(100, Math.round(rawScore)));
    components.push({
      key: k,
      score,
      reason: parsed[k].reason || "",
      evidence: parsed[k].evidence || "",
      limitations: parsed[k].limitations || "",
      weightPct: SCORE_META[k].weightPct,
    });
  }
  return components;
}

// Test with code fences and out-of-bound scores
const testJson = `\`\`\`json
{
  "fit": { "score": 120, "reason": "High B2B relevance", "evidence": "Management consulting", "limitations": "No revenue data" },
  "opportunity": { "score": 75, "reason": "Digital presence exists", "evidence": "Website listed", "limitations": "Traffic unknown" },
  "contact": { "score": -10, "reason": "No phone listed", "evidence": "Phone missing", "limitations": "Unverified email" },
  "quality": { "score": 85.6, "reason": "OSM trace verified", "evidence": "OSM node reference", "limitations": "None" }
}
\`\`\``;

const parsedComponents = validateAndClamp(testJson);
assert.strictEqual(parsedComponents.find((c) => c.key === "fit").score, 100, "120 must clamp to 100");
assert.strictEqual(parsedComponents.find((c) => c.key === "contact").score, 0, "-10 must clamp to 0");
assert.strictEqual(parsedComponents.find((c) => c.key === "quality").score, 86, "85.6 must round to 86");
console.log("✓ Schema parsing, fence stripping, and clamping passed");

console.log("\nALL UNIT TESTS PASSED SUCCESSFULLY!");
