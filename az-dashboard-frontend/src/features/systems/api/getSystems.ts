import { apiClient } from "@/lib/api";

import type { SystemListItem } from "./types";

/** Backend: GET /systems */
export async function getSystems(): Promise<SystemListItem[]> {
  const { data } = await apiClient.get<SystemListItem[]>("/systems");
  return Array.isArray(data) ? data : [];
}
