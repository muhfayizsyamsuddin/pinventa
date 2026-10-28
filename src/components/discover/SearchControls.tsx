"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { DEFAULT_RADIUS, INDUSTRIES, RADII } from "@/lib/config";
import type { RadiusKm, SearchQuery } from "@/types/pinventa";

interface SearchControlsProps {
  initial?: Partial<SearchQuery>;
  /** Called with a validated query. Defaults to opening the results page. */
  onSubmit?: (query: SearchQuery) => void;
}

interface FieldErrors {
  location?: string;
  industry?: string;
}

const LABEL = "label-caps mb-1.5 block";
const INPUT =
  "h-9 w-full rounded-md border border-line bg-card px-3 text-[13px] text-ink placeholder:text-ink-3 focus:border-primary focus:outline-none";

export function SearchControls({ initial, onSubmit }: SearchControlsProps) {
  const router = useRouter();
  const uid = useId();
  const [location, setLocation] = useState(initial?.location ?? "");
  const [radius, setRadius] = useState<RadiusKm>(initial?.radiusKm ?? DEFAULT_RADIUS);
  const [industry, setIndustry] = useState(initial?.industryId ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: FieldErrors = {};
    if (!location.trim()) next.location = "Enter a place name, address, or coordinates.";
    if (!industry) next.industry = "Select an industry.";
    setErrors(next);
    if (next.location || next.industry) return;

    const query: SearchQuery = { location: location.trim(), radiusKm: radius, industryId: industry };
    if (onSubmit) {
      onSubmit(query);
      return;
    }
    const params = new URLSearchParams({
      location: query.location,
      radius: String(query.radiusKm),
      industry: query.industryId,
    });
    startTransition(() => router.push(`/discover/results?${params.toString()}`));
  }

  function handleReset() {
    setLocation("");
    setRadius(DEFAULT_RADIUS);
    setIndustry("");
    setErrors({});
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Search parameters"
      className="grid grid-cols-1 items-start gap-4 rounded-lg border border-line bg-card p-4 lg:grid-cols-12"
    >
      <div className="lg:col-span-5">
        <label htmlFor={`${uid}-location`} className={LABEL}>
          Center point
        </label>
        <div className="relative">
          <Icon
            name="search"
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
          />
          <input
            id={`${uid}-location`}
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, address, or latitude, longitude"
            aria-invalid={Boolean(errors.location)}
            aria-describedby={errors.location ? `${uid}-location-error` : undefined}
            className={`${INPUT} pl-9`}
          />
        </div>
        {errors.location && (
          <p id={`${uid}-location-error`} role="alert" className="mt-1 text-[12px] text-danger">
            {errors.location}
          </p>
        )}
      </div>

      <div className="lg:col-span-3">
        <div className={`${LABEL} flex items-center justify-between`} id={`${uid}-radius-label`}>
          <span>Radius</span>
          <span className="font-mono text-[10px] normal-case tracking-normal text-primary">
            {radius} km
          </span>
        </div>
        <div
          role="radiogroup"
          aria-labelledby={`${uid}-radius-label`}
          className="grid grid-cols-5 gap-1 rounded-md border border-line bg-sunken p-1"
        >
          {RADII.map((km) => {
            const selected = km === radius;
            return (
              <button
                key={km}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setRadius(km)}
                className={`rounded py-1.5 font-mono text-[11px] transition-colors ${
                  selected
                    ? "border border-line bg-card font-medium text-primary"
                    : "border border-transparent text-ink-2 hover:text-ink"
                }`}
              >
                {km} km
              </button>
            );
          })}
        </div>
      </div>

      <div className="lg:col-span-2">
        <label htmlFor={`${uid}-industry`} className={LABEL}>
          Industry
        </label>
        <div className="relative">
          <select
            id={`${uid}-industry`}
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            aria-invalid={Boolean(errors.industry)}
            aria-describedby={errors.industry ? `${uid}-industry-error` : undefined}
            className={`${INPUT} cursor-pointer appearance-none pr-8`}
          >
            <option value="">Select industry…</option>
            {INDUSTRIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <Icon
            name="chevron-down"
            size={16}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3"
          />
        </div>
        {errors.industry && (
          <p id={`${uid}-industry-error`} role="alert" className="mt-1 text-[12px] text-danger">
            {errors.industry}
          </p>
        )}
      </div>

      <div className="flex items-end gap-2 pt-0 lg:col-span-2 lg:pt-[23px]">
        <Button type="submit" variant="primary" className="h-9 flex-1" disabled={pending} aria-busy={pending}>
          {pending ? (
            <>
              <Icon name="loader" size={14} className="animate-spin" />
              Searching…
            </>
          ) : (
            <>
              Search
              <Icon name="arrow-right" size={14} />
            </>
          )}
        </Button>
        <Button
          variant="secondary"
          className="h-9 w-9 px-0"
          onClick={handleReset}
          aria-label="Reset search parameters"
          title="Reset"
        >
          <Icon name="reset" size={16} />
        </Button>
      </div>
    </form>
  );
}
