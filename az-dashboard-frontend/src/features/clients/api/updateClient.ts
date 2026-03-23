import { apiClient } from "@/lib/api";

import type { ClientListItem, UpdateClientPayload } from "./types";

export async function updateClient(
  id: string,
  payload: UpdateClientPayload,
): Promise<ClientListItem> {
  const body: Record<string, unknown> = {};

  if (payload.name !== undefined) body.name = payload.name.trim();

  if (payload.email !== undefined) {
    const t = payload.email.trim();
    body.email = t.length === 0 ? null : t;
  }

  if (payload.phone !== undefined) {
    const t = payload.phone.trim();
    body.phone = t.length === 0 ? null : t;
  }

  if (payload.company !== undefined) {
    const t = payload.company.trim();
    body.company = t.length === 0 ? null : t;
  }

  if (payload.notes !== undefined) {
    const t = payload.notes.trim();
    body.notes = t.length === 0 ? null : t;
  }

  if (payload.status !== undefined) body.status = payload.status;

  const { data } = await apiClient.patch<ClientListItem>(
    `/clients/${id}`,
    body,
  );
  return data;
}
