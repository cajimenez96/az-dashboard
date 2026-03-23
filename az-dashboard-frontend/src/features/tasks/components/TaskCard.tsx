"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import dayjs from "dayjs";
import { GripVertical } from "lucide-react";
import { memo, useCallback } from "react";

import { Badge } from "@/components/ui/badge";
import { taskPriorityLabel, t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import type { TaskListItem } from "../api/types";

function priorityVariant(
  p: TaskListItem["priority"],
): "default" | "secondary" | "destructive" | "outline" {
  switch (p) {
    case "URGENT":
      return "destructive";
    case "HIGH":
      return "default";
    case "MEDIUM":
      return "secondary";
    default:
      return "outline";
  }
}

export const TaskCard = memo(function TaskCard({
  task,
  onOpen,
}: {
  task: TaskListItem;
  onOpen: (t: TaskListItem) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleOpen = useCallback(() => {
    onOpen(task);
  }, [onOpen, task]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border border-border bg-card p-3 shadow-sm",
        "transition-[box-shadow,transform,opacity] duration-200 ease-out",
        "hover:bg-muted/60",
        isDragging && "scale-[1.02] shadow-lg opacity-60",
      )}
    >
      <div className="flex gap-2">
        <button
          type="button"
          className="mt-0.5 shrink-0 touch-none rounded p-0.5 text-muted-foreground hover:bg-muted"
          aria-label={t.tasks.dragTask}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <button
          type="button"
          className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
          onClick={handleOpen}
        >
          <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
            {task.title}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={priorityVariant(task.priority)} className="text-[10px]">
              {taskPriorityLabel(task.priority)}
            </Badge>
            {task.dueDate ? (
              <span className="text-xs text-muted-foreground">
                {t.tasks.due(dayjs(task.dueDate).format("D MMM"))}
              </span>
            ) : null}
          </div>
        </button>
      </div>
    </div>
  );
});

export function TaskCardPreview({ task }: { task: TaskListItem }) {
  return (
    <div className="w-72 rounded-lg border border-border bg-card p-3 shadow-lg ring-2 ring-ring/20 scale-[1.02]">
      <p className="line-clamp-2 text-sm font-medium leading-snug">{task.title}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Badge variant={priorityVariant(task.priority)} className="text-[10px]">
          {taskPriorityLabel(task.priority)}
        </Badge>
        {task.dueDate ? (
          <span className="text-xs text-muted-foreground">
            {t.tasks.due(dayjs(task.dueDate).format("D MMM"))}
          </span>
        ) : null}
      </div>
    </div>
  );
}
