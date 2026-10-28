import { NextResponse } from "next/server";
import { qualifyLeadWithAI } from "@/lib/server/scoring-agent";
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
      let status = 502;
      if (result.code === "MISSING_AI_CONFIG") status = 503;
      else if (result.code === "TIMEOUT") status = 504;
      else if (result.code === "INVALID_INPUT") status = 400;

      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result, { status: 200 });
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
