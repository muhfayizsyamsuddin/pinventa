"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

interface Crumb {
  label: string;
  href?: string;
}

function crumbsFor(pathname: string): Crumb[] {
  const root: Crumb = { label: "Workspace" };
  if (pathname.startsWith("/discover/results")) {
    return [root, { label: "Discover", href: "/discover" }, { label: "Results" }];
  }
  if (pathname.startsWith("/discover")) return [root, { label: "Discover" }];
  if (pathname.startsWith("/leads/")) {
    return [root, { label: "Leads", href: "/leads" }, { label: "Lead detail" }];
  }
  if (pathname.startsWith("/leads")) return [root, { label: "Leads" }];
  if (pathname.startsWith("/outreach")) return [root, { label: "Outreach" }];
  return [root];
}

export function TopBar() {
  const crumbs = crumbsFor(usePathname());
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-canvas px-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[12px] text-ink-2">
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <span key={crumb.label} className="flex items-center gap-2">
              {i > 0 && <span className="text-line-strong">/</span>}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-primary">
                  {crumb.label}
                </Link>
              ) : (
                <span className={last ? "font-medium text-ink" : ""}>{crumb.label}</span>
              )}
            </span>
          );
        })}
      </nav>
      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-1.5 rounded-sm border border-line bg-card px-2 py-1 font-mono text-[10px] text-ink-2 sm:inline-flex">
          <Icon name="info" size={12} className="text-amber" />
          UI preview · no backend connected
        </span>
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full border border-line bg-strong text-ink-2"
          aria-hidden="true"
        >
          <Icon name="user" size={15} />
        </div>
      </div>
    </header>
  );
}
