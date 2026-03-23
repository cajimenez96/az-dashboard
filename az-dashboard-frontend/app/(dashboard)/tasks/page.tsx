"use client";

import type { KanbanArea } from "@/features/kanban/api/types";
import { KanbanBoard } from "@/features/tasks/components/KanbanBoard";
import { useAuthStore } from "@/stores/auth.store";

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

export default function TasksPage() {
  const profile = useAuthStore((s) => s.user?.profile);
  const area = areaFromProfile(profile);

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6">
      <KanbanBoard area={area} />
    </div>
  );
}
