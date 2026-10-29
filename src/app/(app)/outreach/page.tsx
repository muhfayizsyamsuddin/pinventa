import type { Metadata } from "next";
import { Suspense } from "react";
import { OutreachWorkspace } from "@/components/outreach/OutreachWorkspace";

export const metadata: Metadata = { title: "Outreach" };

export default function OutreachPage({ searchParams }: PageProps<"/outreach">) {
  return (
    <Suspense
      fallback={
        <p role="status" className="px-6 py-6 text-[12px] text-ink-2">
          Loading drafts…
        </p>
      }
    >
      <OutreachContent searchParams={searchParams} />
    </Suspense>
  );
}

async function OutreachContent({
  searchParams,
}: Pick<PageProps<"/outreach">, "searchParams">) {
  const params = await searchParams;
  const leadParam = Array.isArray(params.lead) ? params.lead[0] : params.lead;

  return <OutreachWorkspace initialLeadId={leadParam} />;
}
