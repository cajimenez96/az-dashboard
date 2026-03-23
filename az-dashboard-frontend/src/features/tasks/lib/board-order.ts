import type { KanbanColumn } from "@/features/kanban/api/types";

import type { TaskListItem } from "../api/types";

export function sortedColumnIds(columns: KanbanColumn[]): string[] {
  return [...columns]
    .sort((a, b) => a.order - b.order)
    .map((c) => c.id);
}

/** Build per-column lists from a flat array: tasks appear in column order as subsequences. */
export function groupTasksByFlatOrder(
  flat: TaskListItem[],
  columnIds: string[],
): Record<string, TaskListItem[]> {
  const set = new Set(columnIds);
  const grouped: Record<string, TaskListItem[]> = {};
  for (const id of columnIds) grouped[id] = [];
  for (const t of flat) {
    const cid = t.kanbanColumn.id;
    if (set.has(cid)) grouped[cid].push(t);
  }
  return grouped;
}

export function flattenTasksByColumnOrder(
  grouped: Record<string, TaskListItem[]>,
  columnOrder: string[],
): TaskListItem[] {
  return columnOrder.flatMap((id) => grouped[id] ?? []);
}

/** Normalize API list into flat order grouped by columns (stable per-column sequence). */
export function normalizeTasksForBoard(
  tasks: TaskListItem[],
  columns: KanbanColumn[],
): TaskListItem[] {
  const order = sortedColumnIds(columns);
  if (order.length === 0) return tasks;
  const grouped = groupTasksByFlatOrder(tasks, order);
  return flattenTasksByColumnOrder(grouped, order);
}

export function columnMetaMap(
  columns: KanbanColumn[],
): Map<string, KanbanColumn> {
  return new Map(columns.map((c) => [c.id, c]));
}
