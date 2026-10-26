"use client";

import type { BusinessResult } from "@/types/pinventa";

interface MapCanvasProps {
  /** Pins to draw. Omit for the empty (no search yet) canvas. */
  pins?: BusinessResult[];
  radiusKm?: number;
  centerLabel?: string;
  activeId?: string | null;
  onPinSelect?: (id: string) => void;
  /** Shown as a corner tag when the canvas is not a real map. */
  schematicLabel?: string;
}

/**
 * Schematic canvas, NOT a real map. Pin positions are placeholders; a real
 * map (OpenStreetMap tiles) is out of scope for this milestone.
 */
export function MapCanvas({
  pins = [],
  radiusKm,
  centerLabel,
  activeId,
  onPinSelect,
  schematicLabel = "Schematic canvas — not a real map",
}: MapCanvasProps) {
  const hasSearch = radiusKm !== undefined;
  return (
    <div className="relative h-full min-h-[420px] w-full select-none overflow-hidden bg-[#f5f2ea]">
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M48 0H0V48" fill="none" stroke="#e3dec8" strokeWidth="0.75" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <circle cx="50%" cy="50%" r="6" fill="none" stroke="#d3cbb8" />
        <line x1="50%" y1="46%" x2="50%" y2="54%" stroke="#d3cbb8" />
        <line x1="48%" y1="50%" x2="52%" y2="50%" stroke="#d3cbb8" />
        {hasSearch && (
          <>
            <circle
              cx="50%"
              cy="50%"
              r="38%"
              fill="#c4583c"
              fillOpacity="0.06"
              stroke="#c4583c"
              strokeDasharray="4 4"
              strokeWidth="1.25"
            />
            <circle cx="50%" cy="50%" r="19%" fill="none" stroke="#c4583c" strokeOpacity="0.3" />
          </>
        )}
      </svg>

      {hasSearch && (
        <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded border border-line bg-card px-2.5 py-1 shadow-float">
          <span className="max-w-[180px] truncate text-[12px] font-semibold">
            {centerLabel || "Search center"}
          </span>
          <span className="rounded-sm bg-sunken px-1 py-0.5 font-mono text-[10px] text-ink-2">
            {radiusKm} km radius
          </span>
        </div>
      )}

      {pins.map((pin, index) => {
        const active = pin.id === activeId;
        return (
          <button
            key={pin.id}
            type="button"
            onClick={() => onPinSelect?.(pin.id)}
            aria-label={`Pin ${index + 1}: ${pin.name}`}
            style={{ left: `${pin.pin.x}%`, top: `${pin.pin.y}%` }}
            className={`absolute z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center transition-transform ${
              active ? "scale-125" : "hover:scale-110"
            }`}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary font-mono text-[12px] font-bold text-white ring-2 ring-white">
              {index + 1}
            </span>
            <span className="mt-1 whitespace-nowrap rounded border border-line bg-card px-1.5 py-0.5 text-[10px] font-medium">
              {pin.name}
            </span>
          </button>
        );
      })}

      <span className="absolute bottom-3 left-3 z-10 rounded border border-line bg-card/95 px-2 py-1 font-mono text-[10px] text-ink-2">
        {schematicLabel}
      </span>
    </div>
  );
}
