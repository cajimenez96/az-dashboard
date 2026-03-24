import { apiClient } from "@/lib/api";

import type { UserListItem } from "./types";

/** Backend: GET /users (solo SUPERADMIN) */
export async function getUsers(): Promise<UserListItem[]> {
  const { data } = await apiClient.get<UserListItem[]>("/users");
  return Array.isArray(data) ? data : [];
}
