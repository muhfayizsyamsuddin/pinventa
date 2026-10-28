"use client";

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { leadsToCsv } from "@/lib/csv";
import type { Lead } from "@/types/pinventa";

interface ExportCsvButtonProps {
  leads: Lead[];
  /** Used as the download file name prefix. */
  scopeLabel?: string;
}

/** Builds the CSV in the browser. Rows keep their `data_origin` column. */
export function ExportCsvButton({ leads, scopeLabel = "leads" }: ExportCsvButtonProps) {
  const allDemo = leads.length > 0 && leads.every((l) => l.dataOrigin === "demo");

  function handleExport() {
    const csv = leadsToCsv(leads);
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pinventa-${allDemo ? "demo-" : ""}${scopeLabel}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="primary" onClick={handleExport} disabled={leads.length === 0}>
      <Icon name="download" size={14} />
      Export CSV ({leads.length} {leads.length === 1 ? "record" : "records"})
    </Button>
  );
}
