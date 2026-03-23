import type { KanbanArea } from "@/features/kanban/api/types";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface TaskListItem {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  kanbanColumn: {
    id: string;
    name: string;
    area: KanbanArea;
    order: number;
    color: string | null;
  };
  client: { id: string; name: string } | null;
  system: { id: string; name: string; type: string } | null;
  assignedTo: { id: string; name: string; email: string } | null;
  createdBy: { id: string; name: string; email: string };
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  kanbanColumnId: string;
  clientId?: string;
  systemId?: string;
  assignedToId?: string;
}

export type UpdateTaskPayload = Partial<
  Omit<CreateTaskPayload, "kanbanColumnId"> & { kanbanColumnId?: string }
>;
