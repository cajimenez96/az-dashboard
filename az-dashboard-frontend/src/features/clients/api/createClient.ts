import { apiClient } from "@/lib/api";

import type { ClientListItem, CreateClientPayload } from "./types";

export async function createClient(
  payload: CreateClientPayload,
): Promise<ClientListItem> {
  const body: Record<string, unknown> = {
    name: payload.name.trim(),
  };

  const email = payload.email?.trim();
  if (email) body.email = email;

  const phone = payload.phone?.trim();
  if (phone) body.phone = phone;

  const company = payload.company?.trim();
  if (company) body.company = company;

  const notes = payload.notes?.trim();
  if (notes) body.notes = notes;

  if (payload.status) body.status = payload.status;

  const { data } = await apiClient.post<ClientListItem>("/clients", body);
  return data;
}
