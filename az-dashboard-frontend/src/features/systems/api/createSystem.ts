import { apiClient } from "@/lib/api";

import type { CreateSystemPayload, SystemListItem } from "./types";

/** Backend: POST /systems */
export async function createSystem(
  payload: CreateSystemPayload,
): Promise<SystemListItem> {
  const { data } = await apiClient.post<SystemListItem>("/systems", payload);
  return data;
}
