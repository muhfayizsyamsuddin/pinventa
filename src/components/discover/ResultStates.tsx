import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { StateMessage } from "@/components/ui/Panel";

/** No search has run yet. */
export function IdleResults() {
  return (
    <StateMessage icon="list" title="Awaiting search parameters">
      Discovered businesses will appear here with whatever details the source
      provides. Nothing is shown until a search runs.
    </StateMessage>
  );
}

/** Search ran and the source returned nothing. */
export function EmptyResults({ editHref }: { editHref: string }) {
  return (
    <StateMessage
      icon="search"
      title="No businesses found"
      action={<ButtonLink href={editHref}>Adjust search</ButtonLink>}
    >
      The source returned no matching businesses for these parameters. Try a
      larger radius or a different industry. No placeholder results are added.
    </StateMessage>
  );
}

/** Search failed. */
export function ErrorResults({
  editHref,
  onRetry,
}: {
  editHref: string;
  onRetry?: () => void;
}) {
  return (
    <StateMessage
      tone="danger"
      icon="alert"
      title="The search could not be completed"
      action={
        <div className="flex gap-2">
          {onRetry && (
            <Button onClick={onRetry}>
              <Icon name="reset" size={14} />
              Retry
            </Button>
          )}
          <ButtonLink href={editHref}>Edit search</ButtonLink>
        </div>
      }
    >
      The data source did not respond as expected. No results have been
      recorded. Check your parameters and try again.
    </StateMessage>
  );
}

/** Skeleton shown while a search is running. */
export function LoadingResults() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Searching for businesses"
      className="flex flex-col gap-4 p-6"
    >
      <span className="flex items-center gap-2 text-[12px] text-ink-2">
        <Icon name="loader" size={14} className="animate-spin text-primary" />
        Searching for businesses…
      </span>
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse space-y-3 rounded-lg border border-line bg-card p-4">
          <div className="flex gap-3">
            <div className="h-6 w-6 rounded bg-strong" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-1/2 rounded bg-strong" />
              <div className="h-3 w-1/3 rounded bg-sunken" />
            </div>
          </div>
          <div className="h-8 rounded bg-sunken" />
        </div>
      ))}
    </div>
  );
}
