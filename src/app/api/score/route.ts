import { NextResponse } from "next/server";
import { qualifyLeadWithAI } from "@/lib/server/scoring-agent";
import { triggerN8NWorkflow } from "@/lib/server/n8n";
import type { Lead } from "@/types/pinventa";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { lead?: Lead } | null;
    if (!body || !body.lead || typeof body.lead !== "object") {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_INPUT",
          error: "Request body must contain a valid 'lead' object.",
        },
        { status: 400 },
      );
    }

    const lead = body.lead;
    const result = await qualifyLeadWithAI(lead);

    if (!result.success) {
      // Even if AI scoring encounters an issue, notify n8n with raw lead if configured
      const n8nTrigger = await triggerN8NWorkflow({
        event: "score_lead",
        timestamp: new Date().toISOString(),
        lead: {
          id: lead.id,
          refId: lead.refId,
          name: lead.name,
          category: lead.category,
          subcategory: lead.subcategory,
          area: lead.area,
          distanceKm: lead.distanceKm,
          website: lead.websiteUrl || (lead.website === "listed" ? "listed" : "not_listed"),
          websiteUrl: lead.websiteUrl,
          phone: lead.phoneNumber || (lead.phone === "listed" ? "listed" : "not_listed"),
          phoneNumber: lead.phoneNumber,
          email: lead.email,
          emailReady: lead.emailReady,
          status: lead.status,
          sourceLabel: lead.sourceLabel,
          osmUrl: lead.osmUrl,
          facts: lead.facts,
        },
      });

      let status = 502;
      if (result.code === "MISSING_AI_CONFIG") status = 503;
      else if (result.code === "TIMEOUT") status = 504;
      else if (result.code === "INVALID_INPUT") status = 400;

      return NextResponse.json({ ...result, n8n: n8nTrigger }, { status });
    }

    // AI scoring succeeded! Trigger n8n with lead details & calculated score breakdown
    const n8nTrigger = await triggerN8NWorkflow({
      event: "score_lead",
      timestamp: new Date().toISOString(),
      lead: {
        id: lead.id,
        refId: lead.refId,
        name: lead.name,
        category: lead.category,
        subcategory: lead.subcategory,
        area: lead.area,
        distanceKm: lead.distanceKm,
        website: lead.websiteUrl || (lead.website === "listed" ? "listed" : "not_listed"),
        websiteUrl: lead.websiteUrl,
        phone: lead.phoneNumber || (lead.phone === "listed" ? "listed" : "not_listed"),
        phoneNumber: lead.phoneNumber,
        email: lead.email,
        emailReady: lead.emailReady,
        status: lead.status,
        sourceLabel: lead.sourceLabel,
        osmUrl: lead.osmUrl,
        facts: lead.facts,
      },
      qualification: {
        totalScore: result.totalScore,
        priorityBand: result.priorityBand,
        priorityLabel: result.priorityLabel,
        scoringModel: result.scoringModel,
        scoringProvider: result.scoringProvider,
        scoredAt: result.scoredAt,
        components: result.components,
        hypotheses: result.hypotheses,
      },
    });

    // If n8n returns custom B2B opportunity hypotheses, merge them
    let finalHypotheses = result.hypotheses;
    if (n8nTrigger.customHypotheses && n8nTrigger.customHypotheses.length > 0) {
      finalHypotheses = [...n8nTrigger.customHypotheses, ...result.hypotheses];
    }

    return NextResponse.json(
      {
        ...result,
        hypotheses: finalHypotheses,
        n8n: n8nTrigger,
        drafts: n8nTrigger.drafts,
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        code: "SERVER_ERROR",
        error: err instanceof Error ? err.message : "Internal server error during scoring.",
      },
      { status: 500 },
    );
  }
}
