"use client";

import { Badge } from "@/components/ui/badge";
import type { UserProfile, UserRole } from "@/features/users/api/types";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function UserRoleBadge({ role }: { role: UserRole }) {
  const label =
    role === "SUPERADMIN" ? t.users.roleSuperadmin : t.users.roleUser;

  if (role === "SUPERADMIN") {
    return <Badge variant="destructive" className="font-medium">{label}</Badge>;
  }

  return (
    <Badge variant="default" className="font-medium">
      {label}
    </Badge>
  );
}

export function UserProfileBadge({ profile }: { profile: UserProfile }) {
  const label =
    profile === "MARKETER"
      ? t.users.profileMarketer
      : t.users.profileDeveloper;

  if (profile === "MARKETER") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "font-medium",
          "border-blue-500/45 bg-blue-500/10 text-blue-900 dark:text-blue-200",
        )}
      >
        {label}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        "border-violet-500/45 bg-violet-500/12 text-violet-950 dark:text-violet-100",
      )}
    >
      {label}
    </Badge>
  );
}
