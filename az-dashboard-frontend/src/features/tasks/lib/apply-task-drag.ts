import { arrayMove } from "@dnd-kit/sortable";

import type { KanbanColumn } from "@/features/kanban/api/types";

import type { TaskListItem } from "../api/types";
import {
  columnMetaMap,
  flattenTasksByColumnOrder,
  groupTasksByFlatOrder,
  sortedColumnIds,
} from "./board-order";

const COL_PREFIX = "col:";

export function columnDroppableId(columnId: string): string {
  return `${COL_PREFIX}${columnId}`;
}

export function parseColumnDroppableId(id: string): string | null {
  return id.startsWith(COL_PREFIX) ? id.slice(COL_PREFIX.length) : null;
}

function withColumnMeta(
  task: TaskListItem,
  columnId: string,
  meta: Map<string, KanbanColumn>,
): TaskListItem {
  const c = meta.get(columnId);
  if (!c) return task;
  return {
    ...task,
    kanbanColumn: {
      id: c.id,
      name: c.name,
      area: c.area,
      order: c.order,
      color: c.color,
    },
  };
}

export function applyTaskDrag(args: {
  flatTasks: TaskListItem[];
  columns: KanbanColumn[];
  activeTaskId: string;
  overId: string;
}): {
  nextFlat: TaskListItem[];
  columnChanged: boolean;
  patch?: { taskId: string; kanbanColumnId: string };
} {
  const { flatTasks, columns, activeTaskId, overId } = args;
  const colOrder = sortedColumnIds(columns);
  const meta = columnMetaMap(columns);

  if (colOrder.length === 0) {
    return { nextFlat: flatTasks, columnChanged: false };
  }

  const grouped = groupTasksByFlatOrder(flatTasks, colOrder);

  const findContainer = (id: string): string | null => {
    const fromDrop = parseColumnDroppableId(id);
    if (fromDrop && colOrder.includes(fromDrop)) return fromDrop;
    for (const cid of colOrder) {
      if (grouped[cid].some((t) => t.id === id)) return cid;
    }
    return null;
  };

  const activeContainer = findContainer(activeTaskId);
  const overContainer = findContainer(overId);

  if (!activeContainer || !overContainer) {
    return { nextFlat: flatTasks, columnChanged: false };
  }

  if (activeContainer === overContainer) {
    const list = [...grouped[activeContainer]];
    const oldIndex = list.findIndex((t) => t.id === activeTaskId);
    if (oldIndex < 0) return { nextFlat: flatTasks, columnChanged: false };

    let newIndex: number;
    if (parseColumnDroppableId(overId)) {
      newIndex = Math.max(0, list.length - 1);
    } else {
      newIndex = list.findIndex((t) => t.id === overId);
      if (newIndex < 0) newIndex = list.length - 1;
    }

    grouped[activeContainer] = arrayMove(list, oldIndex, newIndex);
    const nextFlat = flattenTasksByColumnOrder(grouped, colOrder);
    return { nextFlat, columnChanged: false };
  }

  const fromList = [...grouped[activeContainer]];
  const fromIdx = fromList.findIndex((t) => t.id === activeTaskId);
  if (fromIdx < 0) return { nextFlat: flatTasks, columnChanged: false };

  const [moved] = fromList.splice(fromIdx, 1);
  grouped[activeContainer] = fromList;

  const toList = [...grouped[overContainer]];
  let insertIndex: number;
  if (parseColumnDroppableId(overId)) {
    insertIndex = toList.length;
  } else {
    insertIndex = toList.findIndex((t) => t.id === overId);
    if (insertIndex < 0) insertIndex = toList.length;
  }

  toList.splice(
    insertIndex,
    0,
    withColumnMeta(moved, overContainer, meta),
  );
  grouped[overContainer] = toList;

  const nextFlat = flattenTasksByColumnOrder(grouped, colOrder);

  return {
    nextFlat,
    columnChanged: true,
    patch: { taskId: activeTaskId, kanbanColumnId: overContainer },
  };
}
