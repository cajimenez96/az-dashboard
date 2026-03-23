import { apiClient } from "@/lib/api";

import type { ClientListItem } from "./types";

export type { ClientListItem, ClientStatus } from "./types";

export async function getClients(): Promise<ClientListItem[]> {
  const { data } = await apiClient.get<ClientListItem[]>("/clients");
  return data;
}
