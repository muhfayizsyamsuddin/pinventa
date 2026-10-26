"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/discover", label: "Discover", icon: "crosshair" },
  { href: "/leads", label: "Leads", icon: "table" },
  { href: "/outreach", label: "Outreach", icon: "mail" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-white">
        <Icon name="compass" size={15} />
      </div>
      <span className="text-[14px] font-semibold tracking-tight">Pinventa</span>
    </div>
  );
}

/** Fixed 220px left rail (DESIGN.md: Left Navigation Rail), shown from lg up. */
export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-[220px] flex-col justify-between border-r border-line bg-rail lg:flex">
      <div>
        <div className="flex h-14 items-center justify-between border-b border-line px-4">
          <Brand />
          <span className="font-mono text-[10px] text-ink-3">UI preview</span>
        </div>
        <p className="label-caps px-5 pb-1 pt-4">Workspace</p>
        <nav aria-label="Primary" className="flex flex-col gap-1 px-2">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded border-l-2 px-3 py-2 text-[13px] transition-colors ${
                  active
                    ? "border-primary bg-card font-semibold text-primary"
                    : "border-transparent text-ink-2 hover:bg-card/60 hover:text-ink"
                }`}
              >
                <Icon name={item.icon} size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t border-line">
        <div className="space-y-0.5 border-b border-line px-4 py-3">
          <p className="label-caps">Planned data source</p>
          <p className="font-mono text-[11px] text-ink-2">OpenStreetMap / Overpass</p>
          <p className="text-[10px] leading-[14px] text-ink-3">
            Not connected in this milestone.
          </p>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-sage text-white">
            <Icon name="building" size={15} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold">MAXY Singapore</p>
            <p className="truncate text-[11px] text-ink-3">Business Development</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

/** Compact horizontal navigation for viewports below lg. */
export function MobileNav() {
  const pathname = usePathname();
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line bg-rail px-4 py-2 lg:hidden">
      <Brand />
      <nav aria-label="Primary" className="flex gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-[12px] ${
                active ? "bg-card font-semibold text-primary" : "text-ink-2"
              }`}
            >
              <Icon name={item.icon} size={14} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
