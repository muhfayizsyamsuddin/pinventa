"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";
import type { BusinessResult } from "@/types/pinventa";

/**
 * Tile source is configurable. Default is the standard OSM tile server over
 * HTTPS (https://operations.osmfoundation.org/policies/tiles/): light use only,
 * attribution always shown, tiles are loaded only for the visible viewport
 * (no prefetching or bulk download).
 */
const TILE_URL = process.env.NEXT_PUBLIC_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  process.env.NEXT_PUBLIC_TILE_ATTRIBUTION ||
  "&copy; <a href='https://www.openstreetmap.org/copyright' target='_blank' rel='noopener noreferrer'>OpenStreetMap</a> contributors";

const PRIMARY = "#c4583c";

interface LeafletMapProps {
  center: { lat: number; lng: number; label: string };
  radiusKm: number;
  /** Same records and order as the result list; marker number = list number. */
  businesses: BusinessResult[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
}

function hasCoords(b: BusinessResult): b is BusinessResult & { lat: number; lng: number } {
  return (
    typeof b.lat === "number" &&
    typeof b.lng === "number" &&
    Number.isFinite(b.lat) &&
    Number.isFinite(b.lng) &&
    b.lat >= -90 &&
    b.lat <= 90 &&
    b.lng >= -180 &&
    b.lng <= 180
  );
}

/** Real geographic map (Leaflet). Client-only; load via LiveMap (dynamic import). */
export function LeafletMap({ center, radiusKm, businesses, activeId, onSelect }: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const mapRef = useRef<L.Map | null>(null);
  const onSelectRef = useRef(onSelect);
  const activeIdRef = useRef(activeId);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    activeIdRef.current = activeId;
    markersRef.current.forEach((marker, id) => {
      marker.getElement()?.classList.toggle("is-active", id === activeId);
      marker.setZIndexOffset(id === activeId ? 1000 : 0);
    });
  }, [activeId]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Validate coordinates and radius before creating map layers
    const isValidLat =
      typeof center?.lat === "number" &&
      Number.isFinite(center.lat) &&
      center.lat >= -90 &&
      center.lat <= 90;
    const isValidLng =
      typeof center?.lng === "number" &&
      Number.isFinite(center.lng) &&
      center.lng >= -180 &&
      center.lng <= 180;
    const isValidRadius =
      typeof radiusKm === "number" &&
      Number.isFinite(radiusKm) &&
      radiusKm > 0;

    if (!isValidLat || !isValidLng || !isValidRadius) {
      return;
    }

    // Clean up any existing map instance on this container before re-initializing
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    delete (el as unknown as { _leaflet_id?: number })._leaflet_id;

    const markers = markersRef.current;
    markers.clear();

    const centerLatLng = L.latLng(center.lat, center.lng);

    // Initialize map with a center and zoom so map is ready (_loaded = true)
    // before layers are attached and circle bounds are computed
    const map = L.map(el, {
      center: centerLatLng,
      zoom: 13,
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: true,
    });
    mapRef.current = map;

    const tileLayer = L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
      keepBuffer: 1,
      updateWhenIdle: true,
    }).addTo(map);

    const circle = L.circle(centerLatLng, {
      radius: radiusKm * 1000,
      color: PRIMARY,
      weight: 1.25,
      dashArray: "4 4",
      fillColor: PRIMARY,
      fillOpacity: 0.06,
    }).addTo(map);

    const centerMarker = L.circleMarker(centerLatLng, {
      radius: 6,
      color: PRIMARY,
      weight: 3,
      fillColor: "#ffffff",
      fillOpacity: 1,
    }).addTo(map);
    const centerTip = document.createElement("span");
    centerTip.textContent = "Search center";
    centerMarker.bindTooltip(centerTip);

    businesses.forEach((business, index) => {
      if (!hasCoords(business)) return;
      const marker = L.marker([business.lat, business.lng], {
        title: business.name,
        icon: L.divIcon({
          className: "pinventa-pin",
          html: `<span>${index + 1}</span>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
      }).addTo(map);
      const tip = document.createElement("span");
      tip.textContent = business.name;
      marker.bindTooltip(tip, { direction: "top", offset: [0, -12] });
      marker.on("click", () => onSelectRef.current?.(business.id));
      marker.getElement()?.classList.toggle("is-active", business.id === activeIdRef.current);
      markers.set(business.id, marker);
    });

    const applyView = () => {
      map.invalidateSize();
      try {
        const bounds = circle.getBounds();
        if (bounds && bounds.isValid && bounds.isValid()) {
          map.fitBounds(bounds, { padding: [24, 24], maxZoom: 16 });
          return;
        }
      } catch {
        // Fall back to geographic bounding box if circle bounds are not yet computed
      }
      map.fitBounds(centerLatLng.toBounds(radiusKm * 2000), { padding: [24, 24], maxZoom: 16 });
    };

    applyView();
    const raf = requestAnimationFrame(applyView);
    const timer = setTimeout(applyView, 120);

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            map.invalidateSize();
          })
        : null;
    ro?.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      ro?.disconnect();
      markers.forEach((m) => m.remove());
      markers.clear();
      circle.remove();
      centerMarker.remove();
      tileLayer.remove();
      map.remove();
      if (mapRef.current === map) {
        mapRef.current = null;
      }
    };
  }, [center.lat, center.lng, radiusKm, businesses]);

  const plotted = businesses.filter(hasCoords).length;

  return (
    <div className="relative h-full min-h-[420px] w-full">
      <div
        ref={containerRef}
        role="application"
        aria-label={`Map of businesses within ${radiusKm} km of the search center`}
        className="absolute inset-0 z-0"
      />
      <div className="pointer-events-none absolute left-3 top-3 z-[1000] flex items-center gap-2 rounded border border-line bg-card px-2.5 py-1 shadow-float">
        <span className="max-w-[180px] truncate text-[12px] font-semibold">{center.label}</span>
        <span className="rounded-sm bg-sunken px-1 py-0.5 font-mono text-[10px] text-ink-2">
          {radiusKm} km radius
        </span>
        <span className="rounded-sm bg-sunken px-1 py-0.5 font-mono text-[10px] text-ink-2">
          {plotted} pinned
        </span>
      </div>
    </div>
  );
}
