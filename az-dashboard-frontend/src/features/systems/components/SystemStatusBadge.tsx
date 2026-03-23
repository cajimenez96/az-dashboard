"use client";

import { Badge } from "@/components/ui/badge";
import type { SystemStatus } from "@/features/systems/api/types";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function labelFor(status: SystemStatus | null): string {
  if (!status) return t.systems.statusActive;
  switch (status) {
    case "ACTIVE":
      return t.systems.statusActive;
    case "MAINTENANCE":
      return t.systems.statusMaintenance;
    case "DEPRECATED":
      return t.systems.statusDeprecated;
    default:
      return status;
  }
}

export function SystemStatusBadge({
  status,
}: {
  status: SystemStatus | null;
}) {
  const effective = status ?? "ACTIVE";
  const label = labelFor(status);

  if (effective === "ACTIVE") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "font-medium",
          "border-emerald-500/45 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200",
        )}
      >
        {label}
      </Badge>
    );
  }

  if (effective === "MAINTENANCE") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "font-medium",
          "border-amber-500/50 bg-amber-500/12 text-amber-950 dark:text-amber-100",
        )}
      >
        {label}
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className="font-medium">
      {label}
    </Badge>
  );
}
