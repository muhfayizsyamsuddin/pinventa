import type { Lead, OpportunityHypothesis, OutreachDraft, ScoreComponent } from "@/types/pinventa";
import { parseDraftSubjectAndBody } from "@/lib/server/google-sheets";

export interface N8NTriggerPayload {
  event: "score_lead";
  timestamp: string;
  language: "en";
  instructions: string;
  lead: {
    id: string;
    refId: string;
    name: string;
    category: string;
    subcategory?: string;
    area?: string;
    distanceKm?: number;
    website?: string;
    websiteUrl?: string;
    phone?: string;
    phoneNumber?: string;
    email?: string;
    emailReady: boolean;
    status: string;
    osmUrl?: string;
    sourceLabel?: string;
    facts?: Array<{ label: string; value: string | null; tag?: string }>;
  };
  qualification?: {
    totalScore: number;
    priorityBand: string;
    priorityLabel: string;
    scoringModel?: string;
    scoringProvider?: string;
    scoredAt?: string;
    components?: ScoreComponent[];
    hypotheses?: OpportunityHypothesis[];
  };
}

export interface N8NTriggerResult {
  triggered: boolean;
  url?: string;
  status?: number;
  message?: string;
  error?: string;
  customHypotheses?: OpportunityHypothesis[];
  drafts?: OutreachDraft[];
}

/**
 * Triggers the configured n8n webhook without blocking or breaking existing Pinventa scoring.
 * If N8N_WEBHOOK_URL is not configured, this safely no-ops.
 */
export async function triggerN8NWorkflow(payload: N8NTriggerPayload): Promise<N8NTriggerResult> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL?.trim();

  if (!webhookUrl) {
    return {
      triggered: false,
      message: "N8N_WEBHOOK_URL not configured. Skipped n8n trigger.",
    };
  }

  const timeoutMs = Number(process.env.N8N_TIMEOUT_MS) || 8000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Pinventa-Scoring/1.0",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const isJson = res.headers.get("content-type")?.includes("application/json");
    const resData = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

    if (!res.ok) {
      const errNote =
        res.status === 404 && webhookUrl.includes("webhook-test")
          ? "n8n test webhook is waiting for active test listener in n8n editor."
          : `n8n webhook returned status ${res.status}`;

      console.warn(`[n8n] Trigger notice (${res.status}): ${errNote}`);
      return {
        triggered: false,
        url: webhookUrl,
        status: res.status,
        error: errNote,
      };
    }

    console.info(`[n8n] Workflow successfully triggered at: ${webhookUrl}`);

    // Unpack resData: handles strings, double-stringified JSON, arrays [ {...} ], and objects
    let parsed: any = resData;
    for (let i = 0; i < 3 && typeof parsed === "string"; i++) {
      try {
        const trimmed = parsed.trim();
        if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
          parsed = JSON.parse(trimmed);
        } else {
          break;
        }
      } catch {
        break;
      }
    }

    // If n8n wrapped response in an item array [ { drafts: [...] } ], unwrap first item
    if (Array.isArray(parsed) && parsed.length === 1 && parsed[0] && typeof parsed[0] === "object") {
      const first = parsed[0];
      if (
        "drafts" in first ||
        "emailDrafts" in first ||
        "hypotheses" in first ||
        "data" in first ||
        "Email Draft 1 (Direct)" in first
      ) {
        parsed = first;
      }
    }

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      if (parsed.data && typeof parsed.data === "object") parsed = parsed.data;
      else if (parsed.body && typeof parsed.body === "object") parsed = parsed.body;
    }

    // 1. Extract potential opportunity hypotheses from n8n
    let customHypotheses: OpportunityHypothesis[] | undefined;
    if (parsed && typeof parsed === "object") {
      const rawHypList = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.hypotheses)
        ? parsed.hypotheses
        : Array.isArray(parsed.b2bSuggestions)
        ? parsed.b2bSuggestions
        : Array.isArray(parsed.recommendations)
        ? parsed.recommendations
        : null;

      if (
        rawHypList &&
        rawHypList.length > 0 &&
        typeof rawHypList[0] === "object" &&
        !("body" in rawHypList[0] && "subject" in rawHypList[0])
      ) {
        customHypotheses = (rawHypList as Array<Record<string, unknown>>).map((item, idx) => ({
          id: String(item.id || `n8n-hyp-${idx + 1}`),
          kindLabel: String(item.kindLabel || "n8n Opportunity"),
          title: String(item.title || item.name || "B2B Suggestion"),
          body: String(item.body || item.description || item.text || ""),
          basis: String(item.basis || "Generated by n8n workflow"),
        }));
      }

      // 2. Extract outreach email drafts from n8n
      let drafts: OutreachDraft[] | undefined;
      let rawDrafts: unknown[] | null = null;

      if (Array.isArray(parsed)) {
        if (
          parsed.length > 0 &&
          typeof parsed[0] === "object" &&
          parsed[0] !== null &&
          ("body" in parsed[0] || "subject" in parsed[0] || "title" in parsed[0])
        ) {
          rawDrafts = parsed;
        }
      } else {
        const cand =
          parsed.drafts ||
          parsed.emailDrafts ||
          parsed.email_drafts ||
          parsed.variants ||
          parsed.outreachDrafts;

        if (Array.isArray(cand)) {
          rawDrafts = cand;
        } else if (typeof cand === "string") {
          try {
            const parsedCand = JSON.parse(cand);
            if (Array.isArray(parsedCand)) rawDrafts = parsedCand;
          } catch {}
        }

        // Also support raw Google Sheets row output from n8n (Email Draft 1, 2, 3 columns)
        if (!rawDrafts) {
          const d1 = parsed["Email Draft 1 (Direct)"] || parsed["Email Draft 1"] || parsed["email_draft_1"];
          const d2 = parsed["Email Draft 2 (Consultative)"] || parsed["Email Draft 2"] || parsed["email_draft_2"];
          const d3 = parsed["Email Draft 3"] || parsed["Email Draft 3 (Partnership)"] || parsed["email_draft_3"];

          if (d1 || d2 || d3) {
            rawDrafts = [
              d1 ? { title: "Draft 1 — Direct Approach", body: d1 } : null,
              d2 ? { title: "Draft 2 — Consultative", body: d2 } : null,
              d3 ? { title: "Draft 3 — Solusi AI & Otomasi", body: d3 } : null,
            ].filter(Boolean);
          }
        }
      }

      if (rawDrafts && rawDrafts.length > 0) {
        drafts = (rawDrafts as Array<Record<string, unknown>>).map((d, idx) => {
          const rawBody = String(d.body || d.content || d.text || "");
          const defaultSubject = String(d.subject || d.headline || `Outreach to ${payload.lead.name}`);
          const { subject, body } = parseDraftSubjectAndBody(rawBody, defaultSubject);

          return {
            id: String(d.id || `${payload.lead.id}-n8n-draft-${idx + 1}`),
            leadId: payload.lead.id,
            title: String(d.title || d.name || `Draft ${idx + 1}`),
            summary: String(d.summary || d.description || `Generated by n8n workflow`),
            subject,
            body: body || rawBody,
            status: "draft" as const,
            dataOrigin: "live" as const,
          };
        });
      }

      console.info(
        `[n8n] Successfully processed: extracted ${drafts?.length ?? 0} drafts, ${customHypotheses?.length ?? 0} hypotheses.`,
      );

      return {
        triggered: true,
        url: webhookUrl,
        status: res.status,
        message: "n8n workflow triggered successfully.",
        customHypotheses,
        drafts,
      };
    }

    return {
      triggered: true,
      url: webhookUrl,
      status: res.status,
      message: "n8n workflow triggered successfully.",
      customHypotheses,
    };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error && err.name === "AbortError"
        ? `n8n webhook timed out after ${timeoutMs / 1000}s.`
        : err instanceof Error
        ? err.message
        : String(err);

    console.warn(`[n8n] Webhook notice: ${errorMsg}`);
    return {
      triggered: false,
      url: webhookUrl,
      error: errorMsg,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch previously saved drafts from n8n / Google Sheets for a specific company.
 */
export async function fetchDraftsFromN8N(
  companyName: string,
  leadId: string,
): Promise<{ success: boolean; drafts?: OutreachDraft[]; error?: string }> {
  const webhookUrl =
    process.env.N8N_FETCH_DRAFTS_WEBHOOK_URL?.trim() ||
    process.env.N8N_WEBHOOK_URL?.trim();

  if (!webhookUrl) {
    return { success: false, error: "n8n webhook URL not configured." };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Pinventa-Outreach-Fetch/1.0",
      },
      body: JSON.stringify({
        event: "get_drafts",
        companyName,
        leadId,
        timestamp: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return { success: false, error: `n8n returned status ${res.status}` };
    }

    const data = await res.json().catch(() => null);
    if (!data) return { success: false, error: "Empty response from n8n" };

    let rawDrafts: unknown[] | null = null;
    if (Array.isArray(data.drafts)) {
      rawDrafts = data.drafts;
    } else if (Array.isArray(data)) {
      rawDrafts = data[0]?.drafts || data;
    }

    if (rawDrafts && rawDrafts.length > 0) {
      const drafts: OutreachDraft[] = (rawDrafts as Array<Record<string, unknown>>).map((d, idx) => ({
        id: String(d.id || `${leadId}-n8n-draft-${idx + 1}`),
        leadId,
        title: String(d.title || `Draft ${idx + 1}`),
        summary: String(d.summary || `Synced via n8n`),
        subject: String(d.subject || `Outreach to ${companyName}`),
        body: String(d.body || ""),
        status: "draft",
        dataOrigin: "live",
      }));
      return { success: true, drafts };
    }

    return { success: false, error: "No drafts found in n8n response." };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
