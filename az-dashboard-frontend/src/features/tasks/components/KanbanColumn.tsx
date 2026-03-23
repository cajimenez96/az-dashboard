"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { memo, useMemo } from "react";

import type { KanbanColumn as KanbanColumnType } from "@/features/kanban/api/types";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import type { TaskListItem } from "../api/types";
import { columnDroppableId } from "../lib/apply-task-drag";
import { TaskCard } from "./TaskCard";

export const KanbanColumn = memo(function KanbanColumn({
  column,
  tasks,
  onNewTask,
  onOpenTask,
  showCardSkeletons,
}: {
  column: KanbanColumnType;
  tasks: TaskListItem[];
  onNewTask: () => void;
  onOpenTask: (t: TaskListItem) => void;
  showCardSkeletons: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnDroppableId(column.id),
  });

  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  return (
    <div
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-xl border border-border bg-muted/20",
        "shadow-sm",
      )}
    >
      <header className="flex items-start justify-between gap-2 border-b border-border/80 px-3 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {column.color ? (
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: column.color }}
                aria-hidden
              />
            ) : null}
            <h2 className="truncate text-sm font-semibold tracking-tight">
              {t.tasks.kanbanColumn(column.name)}
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t.tasks.taskCount(tasks.length)}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 px-2 text-xs font-medium"
          onClick={onNewTask}
        >
          {t.tasks.newTask}
        </Button>
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[140px] flex-1 flex-col gap-2 p-2 transition-colors",
          isOver && "bg-muted/40",
        )}
      >
        {showCardSkeletons ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        ) : tasks.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t.tasks.noTasksInColumn}
          </p>
        ) : (
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onOpen={onOpenTask} />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  );
});

export function KanbanColumnSkeleton() {
  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl border border-border bg-muted/20">
      <div className="space-y-2 border-b border-border/80 px-3 py-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="flex flex-col gap-2 p-2">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    </div>
  );
}
