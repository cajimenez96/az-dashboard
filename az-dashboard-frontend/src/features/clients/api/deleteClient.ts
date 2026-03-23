import { apiClient } from "@/lib/api";

export async function deleteClient(id: string): Promise<void> {
  await apiClient.delete(`/clients/${id}`);
}
