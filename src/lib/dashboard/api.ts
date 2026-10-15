import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { DashboardFilters } from "./types";

const dashboardFiltersSchema = z.object({
  brand: z.string(),
  marketplace: z.string(),
  period: z.enum(["today", "yesterday", "last7", "last30", "custom"]),
  product: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const fetchDashboardDataServer = createServerFn({ method: "POST" })
  .validator(dashboardFiltersSchema)
  .handler(async ({ data }) => {
    const { fetchDashboardDataOnServer } = await import("./api.server");
    return fetchDashboardDataOnServer(data);
  });

export function fetchDashboardData(filters: DashboardFilters) {
  return fetchDashboardDataServer({ data: filters });
}
