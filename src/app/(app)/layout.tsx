import type { ReactNode } from "react";
import { MobileNav, Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

/** Shared shell for Discover, Leads, and Outreach. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Sidebar />
      <div className="flex min-h-screen flex-col lg:pl-[220px]">
        <MobileNav />
        <TopBar />
        <main className="flex flex-1 flex-col">{children}</main>
        <footer className="border-t border-line px-6 py-3 text-[11px] text-ink-3">
          Pinventa · internal prototype · map data credit applies once OpenStreetMap
          is connected (© OpenStreetMap contributors).
        </footer>
      </div>
    </>
  );
}
