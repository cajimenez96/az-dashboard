import { apiClient } from "@/lib/api";

import type { UpdateUserPayload, UserListItem } from "./types";

/** Backend: PATCH /users/:id */
export async function updateUser(
  id: string,
  payload: UpdateUserPayload,
): Promise<UserListItem> {
  const { data } = await apiClient.patch<UserListItem>(
    `/users/${id}`,
    payload,
  );
  return data;
}
