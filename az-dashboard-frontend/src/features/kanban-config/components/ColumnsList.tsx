"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useQueryClient } from "@tanstack/react-query";
import { GripVertical } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import type { KanbanArea, KanbanColumn } from "@/features/kanban/api/types";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/lib/i18n";

import { useReorderColumns } from "../hooks/useReorderColumns";
import { getApiErrorCode } from "../lib/api-error";
import { ColumnItem } from "./ColumnItem";

/** Lista vertical con gap: pointerWithin + closestCorners evita que `over` quede null. */
const sortableListCollision: CollisionDetection = (args) => {
  const pointer = pointerWithin(args);
  if (pointer.length > 0) return pointer;
  return closestCorners(args);
};

export interface ColumnsListProps {
  area: KanbanArea;
  columns: KanbanColumn[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onEdit: (column: KanbanColumn) => void;
  onDelete: (column: KanbanColumn) => void;
}

export function ColumnsList({
  area,
  columns,
  isLoading,
  isError,
  onEdit,
  onDelete,
}: ColumnsListProps) {
  const queryClient = useQueryClient();
  const reorderMutation = useReorderColumns(area);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const sorted = useMemo(() => {
    if (!columns?.length) return [];
    return [...columns].sort((a, b) => a.order - b.order);
  }, [columns]);

  const ids = useMemo(() => sorted.map((c) => c.id), [sorted]);

  const activeColumn = useMemo(
    () => sorted.find((c) => c.id === activeId) ?? null,
    [sorted, activeId],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeStr = String(active.id);
      const overStr = String(over.id);
      const oldIndex = sorted.findIndex((c) => c.id === activeStr);
      const newIndex = sorted.findIndex((c) => c.id === overStr);
      if (oldIndex < 0 || newIndex < 0) return;

      const next = arrayMove(sorted, oldIndex, newIndex);
      const orderedIds = next.map((c) => c.id);

      queryClient.setQueryData<KanbanColumn[]>(
        ["kanban-columns", area],
        next.map((c, i) => ({ ...c, order: i + 1 })),
      );

      reorderMutation.mutate(orderedIds, {
        onSuccess: () => {
          toast.success(t.toast.kanbanColumnsReordered);
        },
        onError: (err) => {
          void queryClient.invalidateQueries({
            queryKey: ["kanban-columns", area],
          });
          const code = getApiErrorCode(err);
          toast.error(
            code === "ONE_OR_MORE_COLUMN_IDS_NOT_FOUND"
              ? t.kanbanConfig.errors.reorderNotFound
              : t.common.error,
          );
        },
      });
    },
    [area, queryClient, reorderMutation, sorted],
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const dndDisabled = reorderMutation.isPending || isLoading;

  if (isError) {
    return (
      <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {t.kanbanConfig.loadError}
      </p>
    );
  }

  if (isLoading && !columns?.length) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!sorted.length) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        {t.kanbanConfig.empty}
      </p>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={sortableListCollision}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul
          className="flex max-w-3xl flex-col gap-3 overflow-x-auto pb-2"
          role="list"
          aria-label={t.kanbanConfig.listAria(area)}
        >
          {sorted.map((col) => (
            <ColumnItem
              key={col.id}
              column={col}
              onEdit={onEdit}
              onDelete={onDelete}
              disabled={dndDisabled}
            />
          ))}
        </ul>
      </SortableContext>

      <DragOverlay dropAnimation={null}>
        {activeColumn ? (
          <div className="pointer-events-none flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-3 shadow-lg md:px-4">
            <GripVertical className="size-5 shrink-0 text-muted-foreground" />
            <span
              className="size-3 shrink-0 rounded-full border border-border/60"
              style={{
                backgroundColor:
                  activeColumn.color && activeColumn.color.trim() !== ""
                    ? activeColumn.color
                    : "var(--muted-foreground)",
              }}
            />
            <span className="text-sm font-medium">{activeColumn.name}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
