import { z } from "zod";

import type { TaskListItem, TaskPriority } from "../api/types";

const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const satisfies readonly TaskPriority[];

export const taskFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "El título debe tener al menos 2 caracteres"),
    description: z.string().trim(),
    priority: z.enum(priorities),
    dueDate: z.string().optional(),
    context: z.enum(["client", "system"]),
    clientId: z.string().optional(),
    systemId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.context === "client") {
      if (!data.clientId || data.clientId.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Seleccione un cliente",
          path: ["clientId"],
        });
      }
    } else {
      if (!data.systemId || data.systemId.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Seleccione un sistema",
          path: ["systemId"],
        });
      }
    }
  });

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export function taskToFormValues(task: TaskListItem): TaskFormValues {
  const hasClient = Boolean(task.client?.id);
  return {
    title: task.title,
    description: task.description ?? "",
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.slice(0, 16) : "",
    context: hasClient ? "client" : "system",
    clientId: task.client?.id ?? "",
    systemId: task.system?.id ?? "",
  };
}

export function defaultTaskFormValues(
  priority: TaskPriority = "MEDIUM",
): TaskFormValues {
  return {
    title: "",
    description: "",
    priority,
    dueDate: "",
    context: "client",
    clientId: "",
    systemId: "",
  };
}
