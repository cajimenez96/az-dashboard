export type KanbanArea = "MARKETING" | "SOFTWARE";

export interface KanbanColumn {
  id: string;
  name: string;
  area: KanbanArea;
  order: number;
  color: string | null;
}
