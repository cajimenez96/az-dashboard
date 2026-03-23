import { apiClient } from "@/lib/api";

import type { ObligationListItem, ObligationQueryParams } from "./types";

/**
 * Lists accounts receivable (expected money). Backend: GET /financial/obligations
 */
export async function getObligations(
  params?: ObligationQueryParams,
): Promise<ObligationListItem[]> {
  const { data } = await apiClient.get<ObligationListItem[]>(
    "/financial/obligations",
    { params },
  );
  return Array.isArray(data) ? data : [];
}
