"use client";

import { Badge } from "@/components/ui/badge";
import type { SystemType } from "@/features/systems/api/types";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function SystemTypeBadge({ type }: { type: SystemType }) {
  const label =
    type === "SAAS" ? t.systems.typeSaas : t.systems.typeCustom;

  if (type === "SAAS") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "font-medium",
          "border-blue-500/40 bg-blue-500/10 text-blue-900 dark:text-blue-200",
        )}
      >
        {label}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="font-medium text-foreground">
      {label}
    </Badge>
  );
}
