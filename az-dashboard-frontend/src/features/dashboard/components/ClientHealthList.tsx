"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ClientListItem, ClientStatus } from "@/features/clients/api/types";
import { t } from "@/lib/i18n";

function badgeLabel(status: ClientStatus): string {
  switch (status) {
    case "ACTIVE":
      return t.dashboard.badgeActivo;
    case "INACTIVE":
      return t.dashboard.badgeInactivo;
    case "AT_RISK":
      return t.dashboard.badgeEnRiesgo;
    default:
      return status;
  }
}

function statusVariant(
  status: ClientStatus,
): "default" | "secondary" | "destructive" {
  switch (status) {
    case "ACTIVE":
      return "default";
    case "INACTIVE":
      return "secondary";
    case "AT_RISK":
      return "destructive";
    default:
      return "secondary";
  }
}

function healthSort(a: ClientListItem, b: ClientListItem): number {
  const rank = (s: ClientStatus) => {
    if (s === "AT_RISK") return 0;
    if (s === "ACTIVE") return 1;
    return 2;
  };
  return rank(a.status) - rank(b.status);
}

export function ClientHealthList({
  clients,
  isLoading,
}: {
  clients: ClientListItem[];
  isLoading: boolean;
}) {
  const top = [...clients].sort(healthSort).slice(0, 5);

  return (
    <Card className="rounded-xl border-border/80 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          {t.dashboard.healthTitle}
        </CardTitle>
        <CardDescription className="text-sm">
          {t.dashboard.healthHint}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded-lg" />
            ))}
          </div>
        ) : top.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t.dashboard.noClientsHealth}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {top.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 py-3.5 first:pt-0"
              >
                <span className="min-w-0 truncate text-sm font-medium text-foreground">
                  {c.name}
                </span>
                <Badge
                  variant={statusVariant(c.status)}
                  className="shrink-0 text-xs font-semibold tracking-wide"
                >
                  {badgeLabel(c.status)}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
