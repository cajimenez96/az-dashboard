"use client";

import { useState } from "react";
import type { KanbanArea } from "@/features/kanban/api/types";
import { KanbanBoard } from "@/features/tasks/components/KanbanBoard";
import { useAuthStore } from "@/stores/auth.store";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function areaFromProfile(profile: string | undefined): KanbanArea {
  const p = (profile ?? "").toUpperCase();
  if (
    p.includes("DEVELOPER") ||
    p.includes("SOFTWARE") ||
    p === "SOFTWARE"
  ) {
    return "SOFTWARE";
  }
  return "MARKETING";
}

function TasksPageContent() {
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  const [pickedArea, setPickedArea] = useState<KanbanArea | null>(null);

  const profileDefault: KanbanArea =
    hasHydrated && user ? areaFromProfile(user.profile) : "MARKETING";

  const area: KanbanArea =
    user && pickedArea !== null ? pickedArea : profileDefault;

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tareas</h1>
          <p className="text-sm text-muted-foreground">
            Gestión de tareas por área
          </p>
        </div>

        <Tabs
          value={area}
          onValueChange={(value) => setPickedArea(value as KanbanArea)}
        >
          <TabsList>
            <TabsTrigger value="MARKETING">Marketing</TabsTrigger>
            <TabsTrigger value="SOFTWARE">Software</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <KanbanBoard key={area} area={area} />
    </div>
  );
}

export default function TasksPage() {
  const userId = useAuthStore((s) => s.user?.id ?? "guest");
  return <TasksPageContent key={userId} />;
}