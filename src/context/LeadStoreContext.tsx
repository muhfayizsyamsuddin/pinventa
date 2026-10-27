"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  addLeadToStore,
  businessToLead,
  getHydratedSnapshot,
  getLeadsSnapshot,
  getServerHydratedSnapshot,
  getServerLeadsSnapshot,
  hydrateLeadStore,
  removeLeadFromStore,
  subscribeLeadStore,
  updateLeadInStore,
} from "@/lib/lead-store";
import type { BusinessResult, Lead } from "@/types/pinventa";

interface LeadStoreValue {
  /** All leads saved in this browser session. */
  leads: Lead[];
  /** True after client hydration is complete (avoids SSR mismatch). */
  isHydrated: boolean;
  /** Save a live BusinessResult as a lead. No-op if already saved (OSM id deduplicate). */
  saveLead: (business: BusinessResult) => void;
  /** Remove a saved lead by id. */
  unsaveLead: (id: string) => void;
  /** Update a saved lead by id with partial fields. */
  updateLead: (id: string, patch: Partial<Lead>) => void;
  /** True if a lead with this id is currently saved. */
  hasLead: (id: string) => boolean;
  /** Look up a saved lead by id. */
  getLeadById: (id: string) => Lead | undefined;
}

const LeadStoreContext = createContext<LeadStoreValue | null>(null);

export function LeadStoreProvider({ children }: { children: ReactNode }) {
  const leads = useSyncExternalStore(
    subscribeLeadStore,
    getLeadsSnapshot,
    getServerLeadsSnapshot,
  );

  const isHydrated = useSyncExternalStore(
    subscribeLeadStore,
    getHydratedSnapshot,
    getServerHydratedSnapshot,
  );

  useEffect(() => {
    hydrateLeadStore();
  }, []);

  const saveLead = useCallback((business: BusinessResult) => {
    const lead = businessToLead(business);
    addLeadToStore(lead);
  }, []);

  const unsaveLead = useCallback((id: string) => {
    removeLeadFromStore(id);
  }, []);

  const updateLead = useCallback((id: string, patch: Partial<Lead>) => {
    updateLeadInStore(id, patch);
  }, []);

  const hasLead = useCallback(
    (id: string) => leads.some((l) => l.id === id),
    [leads],
  );

  const getLeadById = useCallback(
    (id: string) => leads.find((l) => l.id === id),
    [leads],
  );

  const value = useMemo(
    () => ({
      leads,
      isHydrated,
      saveLead,
      unsaveLead,
      updateLead,
      hasLead,
      getLeadById,
    }),
    [leads, isHydrated, saveLead, unsaveLead, updateLead, hasLead, getLeadById],
  );

  return (
    <LeadStoreContext.Provider value={value}>
      {children}
    </LeadStoreContext.Provider>
  );
}

export function useLeadStore(): LeadStoreValue {
  const ctx = useContext(LeadStoreContext);
  if (!ctx) {
    throw new Error("useLeadStore must be used inside <LeadStoreProvider>");
  }
  return ctx;
}
