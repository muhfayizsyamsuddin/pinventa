import type { OutreachDraft } from "@/types/pinventa";

/**
 * Robust RFC 4180-compliant CSV parser that correctly handles
 * multiline strings, escaped quotes (""), and commas inside quotes.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        row.push(cell.trim());
        cell = "";
      } else if (char === "\n") {
        row.push(cell.trim());
        rows.push(row);
        row = [];
        cell = "";
      } else if (char === "\r") {
        // ignore carriage return
      } else {
        cell += char;
      }
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    rows.push(row);
  }

  return rows;
}

/** Extract Subject and Body from draft text if prefixed with "Subjek:" or "Subject:". */
export function parseDraftSubjectAndBody(
  rawText: string,
  defaultSubject: string,
): { subject: string; body: string } {
  const match = rawText.match(/^(?:Subjek|Subject):\s*(.+?)(?:\r?\n\r?\n|\n)([\s\S]*)$/i);
  if (match) {
    return {
      subject: match[1].trim(),
      body: match[2].trim(),
    };
  }
  return {
    subject: defaultSubject,
    body: rawText.trim(),
  };
}

/**
 * Fetch and extract drafts for a specific company directly from a Google Sheet.
 * Works if GOOGLE_SHEET_CSV_URL or GOOGLE_SHEET_ID is configured in environment.
 */
export async function fetchDraftsFromGoogleSheets(
  companyName: string,
  leadId: string,
): Promise<{ success: boolean; drafts?: OutreachDraft[]; error?: string }> {
  let sheetUrl = process.env.GOOGLE_SHEET_CSV_URL?.trim();

  if (!sheetUrl) {
    const sheetId = process.env.GOOGLE_SHEET_ID?.trim();
    if (sheetId) {
      sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
    }
  }

  if (!sheetUrl) {
    return {
      success: false,
      error: "GOOGLE_SHEET_CSV_URL or GOOGLE_SHEET_ID not configured in .env.local",
    };
  }

  try {
    const res = await fetch(sheetUrl, {
      method: "GET",
      headers: {
        Accept: "text/csv,text/plain",
      },
      // Cache for 10 seconds to allow fast updates
      next: { revalidate: 10 },
    });

    if (!res.ok) {
      return {
        success: false,
        error: `Failed to fetch Google Sheet: HTTP ${res.status}`,
      };
    }

    const csvText = await res.text();
    const rows = parseCsv(csvText);

    if (rows.length < 2) {
      return { success: false, error: "Google Sheet is empty or lacks data rows." };
    }

    const headers = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));

    // Find company name column index
    const companyColIndex = headers.findIndex(
      (h) => h.includes("company") || h.includes("name") || h.includes("lead"),
    );

    if (companyColIndex === -1) {
      return { success: false, error: "Could not find Company Name column in Google Sheet." };
    }

    // Find email draft columns
    const draftColIndices: { label: string; index: number }[] = [];
    headers.forEach((h, idx) => {
      if (h.includes("draft") || (h.includes("email") && (h.includes("1") || h.includes("2") || h.includes("3")))) {
        draftColIndices.push({ label: rows[0][idx], index: idx });
      }
    });

    if (draftColIndices.length === 0) {
      return { success: false, error: "No email draft columns found in Google Sheet." };
    }

    // Normalize target company name for comparison
    const targetNorm = companyName.toLowerCase().replace(/[^a-z0-9]/g, "");

    // Find matching row (search from newest row to oldest)
    let matchedRow: string[] | null = null;
    for (let r = rows.length - 1; r >= 1; r--) {
      const cellVal = (rows[r][companyColIndex] || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      if (cellVal && (cellVal === targetNorm || cellVal.includes(targetNorm) || targetNorm.includes(cellVal))) {
        matchedRow = rows[r];
        break;
      }
    }

    if (!matchedRow) {
      return {
        success: false,
        error: `Company "${companyName}" was not found in Google Sheet records.`,
      };
    }

    // Convert draft columns to OutreachDraft[]
    const drafts: OutreachDraft[] = draftColIndices.map((col, idx) => {
      const rawText = matchedRow![col.index] || "";
      const defaultSubject = `Outreach to ${companyName} (${col.label})`;
      const { subject, body } = parseDraftSubjectAndBody(rawText, defaultSubject);

      return {
        id: `${leadId}-gsheet-draft-${idx + 1}`,
        leadId,
        title: col.label || `Draft ${idx + 1}`,
        summary: `Synced from Google Sheets database`,
        subject,
        body,
        status: "draft",
        dataOrigin: "live",
      };
    });

    return {
      success: true,
      drafts,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[GoogleSheets] Error reading drafts:", errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

