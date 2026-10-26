import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";

/** Persistent notice that content is illustrative, not live data. */
export function DemoNotice({
  children = "Illustrative preview — not live data.",
  trailing,
}: {
  children?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div
      role="note"
      className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-amber-soft px-6 py-2 text-[12px] text-ink"
    >
      <span className="flex items-center gap-2 font-medium">
        <Icon name="info" size={15} className="text-amber" />
        {children}
      </span>
      {trailing && <span className="font-mono text-[11px] text-ink-2">{trailing}</span>}
    </div>
  );
}

interface PanelProps {
  title?: string;
  icon?: IconName;
  meta?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Surface 1 panel: white card with a hairline border and no shadow. */
export function Panel({ title, icon, meta, className = "", children }: PanelProps) {
  return (
    <section className={`overflow-hidden rounded-lg border border-line bg-card ${className}`}>
      {title && (
        <header className="flex items-center justify-between border-b border-line bg-stone px-4 py-2.5">
          <h2 className="label-caps flex items-center gap-2 text-ink">
            {icon && <Icon name={icon} size={14} className="text-ink-3" />}
            {title}
          </h2>
          {meta && <span className="font-mono text-[11px] text-ink-3">{meta}</span>}
        </header>
      )}
      {children}
    </section>
  );
}

interface StateMessageProps {
  icon: IconName;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  tone?: "neutral" | "danger";
}

/** Shared layout for empty / error messages. */
export function StateMessage({
  icon,
  title,
  children,
  action,
  tone = "neutral",
}: StateMessageProps) {
  const iconTone =
    tone === "danger" ? "bg-danger-soft text-danger" : "bg-sunken text-ink-3";
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <div className={`flex h-10 w-10 items-center justify-center rounded-full border border-line ${iconTone}`}>
        <Icon name={icon} size={20} />
      </div>
      <div className="max-w-sm space-y-1">
        <h3 className="text-[14px] font-semibold text-ink">{title}</h3>
        {children && <p className="text-[12px] leading-[18px] text-ink-2">{children}</p>}
      </div>
      {action}
    </div>
  );
}

/** Page title block used at the top of each screen. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl space-y-1">
        <h1 className="text-[24px] font-medium leading-8 tracking-[-0.015em] text-ink">
          {title}
        </h1>
        {description && <p className="text-[13px] leading-5 text-ink-2">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
