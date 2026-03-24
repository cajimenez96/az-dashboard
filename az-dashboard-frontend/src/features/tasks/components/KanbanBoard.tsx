"use client";

import {
  closestCorners,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

import type { KanbanArea } from "@/features/kanban/api/types";
import { useKanbanColumns } from "@/features/kanban/hooks/useKanbanColumns";

import { useTasks } from "../hooks/useTasks";
import { useUpdateTask } from "../hooks/useUpdateTask";
import type { TaskListItem } from "../api/types";
import { applyTaskDrag } from "../lib/apply-task-drag";
import {
  groupTasksByFlatOrder,
  normalizeTasksForBoard,
  sortedColumnIds,
} from "../lib/board-order";
import { KanbanColumn, KanbanColumnSkeleton } from "./KanbanColumn";
import { TaskCardPreview } from "./TaskCard";
import { TaskModal } from "./TaskModal";

type ModalState =
  | { mode: "create"; columnId: string }
  | { mode: "edit"; task: TaskListItem }
  | null;

export function KanbanBoard({ area }: { area: KanbanArea }) {
  const queryClient = useQueryClient();
  const { data: columns, isLoading: columnsLoading } = useKanbanColumns(area);
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const updateTask = useUpdateTask();

  const [activeTask, setActiveTask] = useState<TaskListItem | null>(null);
  const [modal, setModal] = useState<ModalState>(null);

  const tasksForArea = useMemo(
    () => (tasks ?? []).filter((t) => t.kanbanColumn.area === area),
    [tasks, area],
  );

  const flatForBoard = useMemo(() => {
    const t = tasksForArea;
    const c = columns ?? [];
    if (c.length === 0) return t;
    return normalizeTasksForBoard(t, c);
  }, [tasksForArea, columns]);

  const grouped = useMemo(() => {
    const c = columns ?? [];
    if (c.length === 0) return {} as Record<string, TaskListItem[]>;
    const ids = sortedColumnIds(c);
    return groupTasksByFlatOrder(flatForBoard, ids);
  }, [flatForBoard, columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = String(event.active.id);
      const t = flatForBoard.find((x) => x.id === id) ?? null;
      setActiveTask(t);
    },
    [flatForBoard],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveTask(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const cols = columns ?? [];
      if (cols.length === 0) return;

      const previousSnapshot = [...flatForBoard];

      const result = applyTaskDrag({
        flatTasks: flatForBoard,
        columns: cols,
        activeTaskId: String(active.id),
        overId: String(over.id),
      });

      queryClient.setQueryData<TaskListItem[]>(["tasks"], result.nextFlat);

      if (result.patch) {
        updateTask.mutate(
          {
            id: result.patch.taskId,
            payload: { kanbanColumnId: result.patch.kanbanColumnId },
          },
          {
            onError: () => {
              queryClient.setQueryData<TaskListItem[]>(
                ["tasks"],
                previousSnapshot,
              );
            },
          },
        );
      }
    },
    [columns, flatForBoard, queryClient, updateTask],
  );

  const handleDragCancel = useCallback(() => {
    setActiveTask(null);
  }, []);

  const showSkeleton = columnsLoading || (tasksLoading && !tasks);

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {showSkeleton ? (
            <>
              <KanbanColumnSkeleton />
              <KanbanColumnSkeleton />
              <KanbanColumnSkeleton />
              <KanbanColumnSkeleton />
            </>
          ) : (
            (columns ?? []).map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                tasks={grouped[col.id] ?? []}
                showCardSkeletons={Boolean(tasksLoading && tasks)}
                onNewTask={() =>
                  setModal({ mode: "create", columnId: col.id })
                }
                onOpenTask={(t) => setModal({ mode: "edit", task: t })}
              />
            ))
          )}
        </div>

        <DragOverlay dropAnimation={null} style={{ zIndex: 100 }}>
          {activeTask ? <TaskCardPreview task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>

      {modal ? (
        <TaskModal
          open
          onOpenChange={(o) => {
            if (!o) setModal(null);
          }}
          mode={modal.mode === "edit" ? "edit" : "create"}
          task={modal.mode === "edit" ? modal.task : null}
          columnId={
            modal.mode === "create"
              ? modal.columnId
              : modal.task.kanbanColumn.id
          }
        />
      ) : null}
    </>
  );
}
