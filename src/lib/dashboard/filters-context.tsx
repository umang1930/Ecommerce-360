import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboardData } from "./api";
import { addDays, todayIST } from "./dates";
import type { DashboardData, DashboardFilters } from "./types";

export const DEFAULT_FILTERS: DashboardFilters = {
  brand: "all",
  marketplace: "all",
  period: "last7",
  product: "all",
  startDate: addDays(todayIST(), -6),
  endDate: todayIST(),
};

interface DashboardContextValue {
  filters: DashboardFilters;
  setFilter: <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => void;
  resetFilters: () => void;
  applyCustomRange: (start: string, end: string) => void;
  data: DashboardData | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  refetch: () => void;
  catalog: { sku: string; name: string; brand: string }[];
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);

  const query = useQuery({
    queryKey: ["dashboard", appliedFilters],
    queryFn: () => fetchDashboardData(appliedFilters),
    staleTime: 30_000,
    // A failed Amazon request may be a rate-limit response; don't multiply it
    // into several immediate attempts through React Query's default retries.
    retry: false,
    refetchOnWindowFocus: false,
  });

  const value = useMemo<DashboardContextValue>(
    () => ({
      filters,
      setFilter: (key, val) => {
        setFilters((prev) => {
          const next = { ...prev, [key]: val, ...(key === "brand" ? { product: "all" } : {}) };
          // Custom range only applies once the user hits Apply.
          if (!(key === "period" && val === "custom")) setAppliedFilters(next);
          return next;
        });
      },
      resetFilters: () => {
        setFilters(DEFAULT_FILTERS);
        setAppliedFilters(DEFAULT_FILTERS);
      },
      applyCustomRange: (start, end) => {
        setFilters((prev) => {
          const next = { ...prev, period: "custom" as const, startDate: start, endDate: end };
          setAppliedFilters(next);
          return next;
        });
      },
      data: query.data,
      isLoading: query.isPending || query.isFetching,
      isError: query.isError,
      errorMessage: query.error instanceof Error ? query.error.message : null,
      refetch: () => void query.refetch(),
      catalog: query.data?.catalog ?? [],
    }),
    [
      filters,
      query.data,
      query.isPending,
      query.isFetching,
      query.isError,
      query.error,
      query.refetch,
    ],
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used inside DashboardProvider");
  return ctx;
}
