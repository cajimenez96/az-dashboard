import type { UserListItem, UserRole } from "../api/types";

/**
 * Indica si al pasar a `newRole` quedaría el sistema sin ningún SUPERADMIN.
 */
export function wouldRemoveLastSuperadmin(
  users: UserListItem[],
  editingUserId: string,
  newRole: UserRole,
): boolean {
  if (newRole !== "USER") return false;
  const target = users.find((u) => u.id === editingUserId);
  if (!target || target.role !== "SUPERADMIN") return false;
  const superCount = users.filter((u) => u.role === "SUPERADMIN").length;
  return superCount === 1;
}
