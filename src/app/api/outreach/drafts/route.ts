import { NextResponse } from "next/server";
import { fetchDraftsFromGoogleSheets } from "@/lib/server/google-sheets";
import { fetchDraftsFromN8N } from "@/lib/server/n8n";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyName = searchParams.get("company")?.trim();
  const leadId = searchParams.get("leadId")?.trim();

  if (!companyName || !leadId) {
    return NextResponse.json(
      { success: false, error: "Query parameters 'company' and 'leadId' are required." },
      { status: 400 },
    );
  }

  // 1. First attempt: Direct Google Sheets database read (if configured)
  const sheetResult = await fetchDraftsFromGoogleSheets(companyName, leadId);
  if (sheetResult.success && sheetResult.drafts && sheetResult.drafts.length > 0) {
    return NextResponse.json({
      success: true,
      source: "google_sheets",
      drafts: sheetResult.drafts,
    });
  }

  // 2. Second attempt: Fetch via n8n workflow
  const n8nResult = await fetchDraftsFromN8N(companyName, leadId);
  if (n8nResult.success && n8nResult.drafts && n8nResult.drafts.length > 0) {
    return NextResponse.json({
      success: true,
      source: "n8n",
      drafts: n8nResult.drafts,
    });
  }

  // If neither found, return diagnostic error
  return NextResponse.json(
    {
      success: false,
      error:
        sheetResult.error ||
        n8nResult.error ||
        `No drafts found for company "${companyName}".`,
      details: {
        googleSheets: sheetResult.error,
        n8n: n8nResult.error,
      },
    },
    { status: 404 },
  );
}

