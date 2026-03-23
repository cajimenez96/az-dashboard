import { apiClient } from "@/lib/api";

import type { SystemListItem, UpdateSystemPayload } from "./types";

/** Backend: PATCH /systems/:id */
export async function updateSystem(
  id: string,
  payload: UpdateSystemPayload,
): Promise<SystemListItem> {
  const { data } = await apiClient.patch<SystemListItem>(
    `/systems/${id}`,
    payload,
  );
  return data;
}
