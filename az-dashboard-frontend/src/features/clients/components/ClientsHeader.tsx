"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

export interface ClientsHeaderProps {
  onNewClient: () => void;
}

export function ClientsHeader({ onNewClient }: ClientsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t.clients.title}
        </h1>
        <p className="text-sm text-muted-foreground">{t.clients.subtitle}</p>
      </div>
      <Button
        type="button"
        onClick={onNewClient}
        className="shrink-0 gap-2 shadow-sm"
      >
        <Plus className="size-4" aria-hidden />
        {t.clients.newClient}
      </Button>
    </div>
  );
}
