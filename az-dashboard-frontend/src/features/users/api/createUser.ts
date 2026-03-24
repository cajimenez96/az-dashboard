import { apiClient } from "@/lib/api";

import type { CreateUserPayload, UserListItem } from "./types";

/** Backend: POST /users */
export async function createUser(
  payload: CreateUserPayload,
): Promise<UserListItem> {
  const { data } = await apiClient.post<UserListItem>("/users", payload);
  return data;
}
