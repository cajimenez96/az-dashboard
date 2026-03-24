"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";

import type { KanbanColumn } from "@/features/kanban/api/types";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface ColumnItemProps {
  column: KanbanColumn;
  onEdit: (column: KanbanColumn) => void;
  onDelete: (column: KanbanColumn) => void;
  disabled?: boolean;
}

export function ColumnItem({
  column,
  onEdit,
  onDelete,
  disabled,
}: ColumnItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const swatch =
    column.color && column.color.trim() !== ""
      ? column.color
      : "var(--muted-foreground)";

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "group list-none",
        "flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-3 shadow-sm transition-shadow md:px-4",
        "hover:border-border/80 hover:shadow-md",
        isDragging && "z-10 border-primary/40 opacity-90 shadow-md ring-2 ring-primary/20",
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        className={cn(
          "touch-none rounded-md p-1 text-muted-foreground transition-colors",
          "hover:bg-muted hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          disabled && "pointer-events-none opacity-40",
        )}
        aria-label={t.kanbanConfig.dragHandleAria}
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-5 shrink-0" aria-hidden />
      </button>

      <span
        className="size-3 shrink-0 rounded-full border border-border/60 ring-1 ring-black/5"
        style={{ backgroundColor: swatch }}
        aria-hidden
      />

      <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
        {column.name}
      </span>

      <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 rounded-md text-muted-foreground hover:text-foreground"
          aria-label={t.kanbanConfig.editAria(column.name)}
          onClick={() => onEdit(column)}
          disabled={disabled}
        >
          <Pencil className="size-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 rounded-md text-muted-foreground hover:text-destructive"
          aria-label={t.kanbanConfig.deleteAria(column.name)}
          onClick={() => onDelete(column)}
          disabled={disabled}
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </div>
    </li>
  );
}
