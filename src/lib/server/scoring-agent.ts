import { SCORE_META } from "@/lib/config";
import { PRIORITY_LABEL, priorityBand, totalScore } from "@/lib/scoring";
import type { Lead, OpportunityHypothesis, PriorityBand, ScoreComponent, ScoreComponentKey } from "@/types/pinventa";

export interface AIProviderConfig {
  provider: "openrouter" | "gemini" | "openai" | null;
  apiKey?: string;
  model: string;
  baseUrl?: string;
}

export interface ScoreAgentResultSuccess {
  success: true;
  components: ScoreComponent[];
  totalScore: number;
  priorityBand: PriorityBand;
  priorityLabel: string;
  scoredAt: string;
  scoringModel: string;
  scoringProvider: string;
  hypotheses: OpportunityHypothesis[];
}

export interface ScoreAgentResultError {
  success: false;
  error: string;
  code:
    | "MISSING_AI_CONFIG"
    | "INVALID_INPUT"
    | "PROVIDER_ERROR"
    | "TIMEOUT"
    | "INVALID_AI_RESPONSE";
  instructions?: string;
  details?: string;
}

export type ScoreAgentResult = ScoreAgentResultSuccess | ScoreAgentResultError;

/** Detect configured AI provider from server environment variables. */
export function getAIProviderConfig(): AIProviderConfig {
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  if (openRouterKey) {
    return {
      provider: "openrouter",
      apiKey: openRouterKey,
      model: process.env.OPENROUTER_MODEL?.trim() || "google/gemini-2.5-flash",
    };
  }

  const geminiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)?.trim();
  if (geminiKey) {
    return {
      provider: "gemini",
      apiKey: geminiKey,
      model: process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash",
    };
  }

  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  if (openAiKey) {
    return {
      provider: "openai",
      apiKey: openAiKey,
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
      baseUrl: (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/+$/, ""),
    };
  }

  return {
    provider: null,
    model: "",
  };
}

/** Construct a strictly grounded, non-hallucinatory prompt for lead qualification. */
function buildQualificationPrompt(lead: Lead): { system: string; user: string } {
  const observedFactsList = (lead.facts || [])
    .map((f) => `- ${f.label}: ${f.value ?? "Not listed"}${f.tag ? ` (${f.tag})` : ""}`)
    .join("\n");

  const system = `You are an expert, objective B2B qualification analyst for Pinventa (evaluating B2B opportunities in Singapore for MAXY Academy enterprise digital and AI services).

YOUR CRITICAL RULES:
1. GROUNDING ONLY: Score based STRICTLY on the observed lead data provided. Do NOT fabricate, assume, or hallucinate:
   - Company revenue or financial health
   - Employee headcount
   - Specific internal pain points or tech stack
   - Contact person names or job titles
   - Independent verification of phone numbers or email deliverability
2. ACCURATE DIGITAL CONTEXT:
   - The absence of a website indicates low digital visibility, but is NOT automatic proof that the business needs or wants AI.
   - Contact data from OpenStreetMap is crowdsourced public data, NOT an independently verified sales channel.
3. OFFICIAL SCORING CRITERIA (Four Pillars, each 0–100):
   - fit (30% weight): "Industry & Customer Fit" — How relevant is this business category and sector to B2B enterprise training, AI, and digital services?
   - opportunity (25% weight): "Identifiable Digital / AI Opportunity" — Identifiable digital presence gaps or AI transformation opportunities supported by visible facts.
   - contact (25% weight): "Contact Readiness" — Availability and quality of listed communication channels (website, phone, email) in source records.
   - quality (20% weight): "Data Quality & Evidence Confidence" — Completeness, source traceability, and confidence of available evidence. If data is sparse or unverified, this sub-score MUST be lower.
4. AUDITABILITY:
   - For every pillar, provide:
     - score (integer 0 to 100)
     - reason (clear analytical justification, 1-2 sentences)
     - evidence (factual facts from source data supporting this assessment)
     - limitations (known gaps, missing data, or unverified aspects)
5. POTENTIAL OPPORTUNITIES (HYPOTHESES):
   - Synthesize 1 to 3 grounded potential opportunity hypotheses relevant to MAXY Academy's B2B enterprise services (Corporate AI training/upskilling, digital workflows, process automation, or client intake solutions).
   - kindLabel: Short badge label (e.g. 'Workflow opportunity', 'AI upskilling', 'Digital enablement', 'Service positioning')
   - title: Clear, descriptive opportunity title
   - body: Objective hypothesis explaining the opportunity (1-2 sentences), strictly noting it is a testable hypothesis and not an observed internal flaw.
   - basis: Explicit basis grounded in observed facts (e.g. 'Basis: business category and presence of listed website. No internal review performed.')

You MUST reply with ONLY a single valid JSON object in this exact format without any markdown backticks:
{
  "fit": {
    "score": 0,
    "reason": "...",
    "evidence": "...",
    "limitations": "..."
  },
  "opportunity": {
    "score": 0,
    "reason": "...",
    "evidence": "...",
    "limitations": "..."
  },
  "contact": {
    "score": 0,
    "reason": "...",
    "evidence": "...",
    "limitations": "..."
  },
  "quality": {
    "score": 0,
    "reason": "...",
    "evidence": "...",
    "limitations": "..."
  },
  "hypotheses": [
    {
      "id": "h1",
      "kindLabel": "Workflow opportunity",
      "title": "...",
      "body": "...",
      "basis": "..."
    }
  ]
}`;

  const user = `EVALUATE THIS LEAD:
Business Name: ${lead.name}
Reference ID: ${lead.refId}
Category: ${lead.category || "Not listed"}
Subcategory: ${lead.subcategory || "Not listed"}
Area / Location: ${lead.area || "Not listed"}
Distance from Target Center: ${lead.distanceKm.toFixed(1)} km
Source: ${lead.sourceLabel || "OpenStreetMap"}
Source URL: ${lead.osmUrl || "Not listed"}
Website Status: ${lead.website === "listed" ? `Listed (${lead.websiteUrl || "URL on record"})` : "Not listed in source"}
Phone Status: ${lead.phone === "listed" ? `Listed (${lead.phoneNumber || "number on record"})` : "Not listed in source"}
Email Status: ${lead.email ? `Listed (${lead.email})` : "Not listed in source"}
Email Ready: ${lead.emailReady ? "Yes (work email on record)" : "No (requires independent verification)"}

Observed Facts on Record:
${observedFactsList || "- None listed"}

Evaluate each of the 4 pillars (fit, opportunity, contact, quality) and provide 1 to 3 potential opportunity hypotheses according to the instructions.`;

  return { system, user };
}

interface RawPillarResponse {
  score?: number | string;
  reason?: string;
  evidence?: string;
  limitations?: string;
}

interface RawHypothesisResponse {
  id?: string;
  kindLabel?: string;
  title?: string;
  body?: string;
  basis?: string;
}

interface RawAIResponse {
  fit?: RawPillarResponse;
  opportunity?: RawPillarResponse;
  contact?: RawPillarResponse;
  quality?: RawPillarResponse;
  hypotheses?: RawHypothesisResponse[];
}

/** Extract, clamp, and validate AI hypotheses, or build grounded fallback hypotheses. */
export function validateAndBuildHypotheses(
  rawJsonText: string,
  lead?: Lead,
): OpportunityHypothesis[] {
  let cleaned = rawJsonText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  const result: OpportunityHypothesis[] = [];

  try {
    const parsed = JSON.parse(cleaned) as RawAIResponse;
    if (parsed && Array.isArray(parsed.hypotheses)) {
      parsed.hypotheses.forEach((item, index) => {
        if (!item || typeof item !== "object") return;
        const title = (item.title || "").trim();
        const body = (item.body || "").trim();
        if (!title && !body) return;

        result.push({
          id: item.id?.trim() || `h-${index + 1}`,
          kindLabel: item.kindLabel?.trim() || "Workflow opportunity",
          title: title || `Opportunity for ${lead?.category || "business"}`,
          body: body || "Hypothesis based on observed commercial activity and digital presence.",
          basis:
            item.basis?.trim() ||
            `Basis: observed business category (${lead?.category || "listed"}) and recorded presence.`,
        });
      });
    }
  } catch {
    // If JSON parsing fails, fallback handles it
  }

  // If AI didn't provide any hypotheses, synthesize grounded fallback hypotheses
  if (result.length === 0 && lead) {
    const category = lead.category || "Commercial enterprise";
    const hasWeb = lead.website === "listed";

    result.push({
      id: "h1",
      kindLabel: "Workflow opportunity",
      title: `Client intake & engagement automation for ${category}`,
      body: `Firms in ${category} often manage prospective client inquiries and requirements manually. Automated enquiry triage and digital workflows could streamline initial client intake.`,
      basis: `Basis: business category (${category}) recorded in OSM. Internal operations have not been evaluated.`,
    });

    if (hasWeb) {
      result.push({
        id: "h2",
        kindLabel: "AI upskilling",
        title: `Enterprise AI workflow adoption for ${category}`,
        body: `With an active digital footprint, this business could explore executive or operational upskilling in generative AI tools to enhance team productivity and service turnaround.`,
        basis: `Basis: presence of listed website (${lead.websiteUrl || "on record"}) and commercial sector. Content has not been audited.`,
      });
    }
  }

  return result;
}

/** Sanitize, clamp, and validate AI JSON response into official ScoreComponent array. */
export function validateAndBuildScoreComponents(rawJsonText: string): ScoreComponent[] {
  let cleaned = rawJsonText.trim();
  // Strip markdown code fences if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  const parsed = JSON.parse(cleaned) as RawAIResponse;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("AI output is not a JSON object");
  }

  const keys: ScoreComponentKey[] = ["fit", "opportunity", "contact", "quality"];
  const components: ScoreComponent[] = [];

  for (const key of keys) {
    const rawPillar = parsed[key];
    if (!rawPillar || typeof rawPillar !== "object") {
      throw new Error(`Missing or invalid component "${key}" in AI output`);
    }

    const numScore = Number(rawPillar.score);
    if (!Number.isFinite(numScore)) {
      throw new Error(`Component "${key}" score is not a finite number`);
    }

    // Clamp score strictly between 0 and 100
    const score = Math.max(0, Math.min(100, Math.round(numScore)));
    const reason = (rawPillar.reason || "").trim() || `Assessment for ${SCORE_META[key].label}`;
    const evidence = (rawPillar.evidence || "").trim() || "Source data observed from OpenStreetMap record";
    const limitations = (rawPillar.limitations || "").trim() || "No further public record available";

    components.push({
      key,
      label: SCORE_META[key].label,
      weightPct: SCORE_META[key].weightPct,
      score,
      reason,
      evidence,
      limitations,
    });
  }

  return components;
}

/**
 * Execute server-side qualification scoring for a lead using the configured AI provider.
 * Does NOT alter lead data directly; returns validated result or descriptive error.
 */
export async function qualifyLeadWithAI(lead: Lead): Promise<ScoreAgentResult> {
  if (!lead || !lead.name) {
    return {
      success: false,
      code: "INVALID_INPUT",
      error: "Invalid lead payload: lead name is required.",
    };
  }

  const config = getAIProviderConfig();
  if (!config.provider || !config.apiKey) {
    return {
      success: false,
      code: "MISSING_AI_CONFIG",
      error: "No AI provider configured on server.",
      instructions:
        "To enable real AI lead scoring, configure OPENROUTER_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY in .env.local on the server.",
    };
  }

  const { system, user } = buildQualificationPrompt(lead);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    let rawText = "";

    if (config.provider === "openrouter") {
      const endpoint = "https://openrouter.ai/api/v1/chat/completions";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
          "HTTP-Referer": "https://pinventa.maxy.academy",
          "X-Title": "Pinventa Lead Qualification",
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          max_tokens: 1500,
          temperature: 0.2,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        let sanitizedErrorMsg = "";
        try {
          const errJson = JSON.parse(errorText);
          sanitizedErrorMsg = errJson?.error?.message || "";
        } catch {
          // not json
        }

        let userFriendlyError = `OpenRouter error (${response.status}): ${sanitizedErrorMsg || response.statusText}`;
        if (response.status === 404) {
          userFriendlyError = `OpenRouter model not found (404): ${sanitizedErrorMsg || `Model '${config.model}' does not exist in OpenRouter catalog. Set OPENROUTER_MODEL in .env.local.`}`;
        } else if (response.status === 401 || response.status === 403) {
          userFriendlyError = `OpenRouter authentication error (${response.status}): ${sanitizedErrorMsg || "Invalid API key."}`;
        } else if (response.status === 402) {
          userFriendlyError = `OpenRouter credit limit or token budget reached (402): ${sanitizedErrorMsg || "Insufficient credits or key quota exceeded."}`;
        } else if (response.status === 429) {
          userFriendlyError = `OpenRouter rate limit exceeded (429): ${sanitizedErrorMsg || "Too many requests. Please retry in a few moments."}`;
        }

        // Safe diagnostic logging (no API keys, tokens, or sensitive headers)
        console.error(`[AI Qualification Agent] Provider: openrouter | Model: ${config.model} | Endpoint: ${endpoint} | HTTP Status: ${response.status} ${response.statusText} | Error: ${sanitizedErrorMsg || response.statusText}`);

        return {
          success: false,
          code: "PROVIDER_ERROR",
          error: userFriendlyError,
          details: errorText.slice(0, 500),
        };
      }

      console.log(`[AI Qualification Agent] Provider: openrouter | Model: ${config.model} | Endpoint: ${endpoint} | HTTP Status: 200 OK | Lead: ${lead.name}`);
      const data = await response.json();
      rawText = data?.choices?.[0]?.message?.content || "";
    } else if (config.provider === "gemini") {
      const safeEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent`;
      const url = `${safeEndpoint}?key=${encodeURIComponent(config.apiKey)}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${system}\n\n${user}` }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
            maxOutputTokens: 1500,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        let sanitizedErrorMsg = "";
        try {
          const errJson = JSON.parse(errorText);
          sanitizedErrorMsg = errJson?.error?.message || "";
        } catch {
          // not json
        }

        let userFriendlyError = `Google Gemini error (${response.status}): ${sanitizedErrorMsg || response.statusText}`;
        if (response.status === 404) {
          userFriendlyError = `Google Gemini model not found (404): ${sanitizedErrorMsg || `Model '${config.model}' not found.`}`;
        } else if (response.status === 400 && sanitizedErrorMsg.includes("API key")) {
          userFriendlyError = `Google Gemini authentication failed: ${sanitizedErrorMsg}`;
        } else if (response.status === 429) {
          userFriendlyError = `Google Gemini quota/rate limit exceeded (429): ${sanitizedErrorMsg || "Quota exceeded."}`;
        }

        // Safe diagnostic logging (URL without ?key=... query param)
        console.error(`[AI Qualification Agent] Provider: gemini | Model: ${config.model} | Endpoint: ${safeEndpoint} | HTTP Status: ${response.status} ${response.statusText} | Error: ${sanitizedErrorMsg || response.statusText}`);

        return {
          success: false,
          code: "PROVIDER_ERROR",
          error: userFriendlyError,
          details: errorText.slice(0, 500),
        };
      }

      console.log(`[AI Qualification Agent] Provider: gemini | Model: ${config.model} | Endpoint: ${safeEndpoint} | HTTP Status: 200 OK | Lead: ${lead.name}`);
      const data = await response.json();
      rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else if (config.provider === "openai") {
      const endpoint = `${config.baseUrl}/chat/completions`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          max_tokens: 1500,
          temperature: 0.2,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        let sanitizedErrorMsg = "";
        try {
          const errJson = JSON.parse(errorText);
          sanitizedErrorMsg = errJson?.error?.message || "";
        } catch {
          // not json
        }

        let userFriendlyError = `OpenAI error (${response.status}): ${sanitizedErrorMsg || response.statusText}`;
        if (response.status === 404) {
          userFriendlyError = `OpenAI model or endpoint not found (404): ${sanitizedErrorMsg || `Model '${config.model}' not found.`}`;
        } else if (response.status === 401) {
          userFriendlyError = `OpenAI authentication failed (401): ${sanitizedErrorMsg || "Invalid API key."}`;
        } else if (response.status === 429) {
          userFriendlyError = `OpenAI rate limit / quota exceeded (429): ${sanitizedErrorMsg || "Quota exceeded."}`;
        }

        console.error(`[AI Qualification Agent] Provider: openai | Model: ${config.model} | Endpoint: ${endpoint} | HTTP Status: ${response.status} ${response.statusText} | Error: ${sanitizedErrorMsg || response.statusText}`);

        return {
          success: false,
          code: "PROVIDER_ERROR",
          error: userFriendlyError,
          details: errorText.slice(0, 500),
        };
      }

      console.log(`[AI Qualification Agent] Provider: openai | Model: ${config.model} | Endpoint: ${endpoint} | HTTP Status: 200 OK | Lead: ${lead.name}`);

      const data = await response.json();
      rawText = data?.choices?.[0]?.message?.content || "";
    }

    if (!rawText.trim()) {
      return {
        success: false,
        code: "INVALID_AI_RESPONSE",
        error: "AI provider returned an empty response.",
      };
    }

    // Validate schema, clamp sub-scores, and build components
    let components: ScoreComponent[];
    try {
      components = validateAndBuildScoreComponents(rawText);
    } catch (parseErr) {
      return {
        success: false,
        code: "INVALID_AI_RESPONSE",
        error: "AI provider response failed schema validation.",
        details: parseErr instanceof Error ? parseErr.message : String(parseErr),
      };
    }

    // Extract and validate potential opportunities hypotheses
    const hypotheses = validateAndBuildHypotheses(rawText, lead);

    // Deterministically compute total score and priority band using official formula
    const total = totalScore(components);
    const band = priorityBand(total);

    return {
      success: true,
      components,
      totalScore: total,
      priorityBand: band,
      priorityLabel: PRIORITY_LABEL[band],
      scoredAt: new Date().toISOString(),
      scoringModel: config.model,
      scoringProvider: config.provider,
      hypotheses,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      return {
        success: false,
        code: "TIMEOUT",
        error: "AI qualification request timed out after 30 seconds.",
      };
    }

    return {
      success: false,
      code: "PROVIDER_ERROR",
      error: err instanceof Error ? err.message : "Unknown error during AI scoring execution.",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
