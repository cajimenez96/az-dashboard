import { z } from "zod";

import type { CreateSystemPayload, UpdateSystemPayload } from "../api/types";

const systemTypes = ["SAAS", "CUSTOM"] as const;
const systemStatuses = ["ACTIVE", "MAINTENANCE", "DEPRECATED"] as const;

export const systemFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres"),
  clientId: z.string().min(1, "Seleccione un cliente"),
  type: z.enum(systemTypes),
  status: z.enum(systemStatuses),
  repoUrl: z.string().trim().superRefine((val, ctx) => {
    if (val.length === 0) return;
    const parsed = z.string().url().safeParse(val);
    if (!parsed.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ingrese una URL válida (con https://)",
      });
    }
  }),
});

export type SystemFormValues = z.infer<typeof systemFormSchema>;

export function defaultSystemFormValues(): SystemFormValues {
  return {
    name: "",
    clientId: "",
    type: "SAAS",
    status: "ACTIVE",
    repoUrl: "",
  };
}

export function systemToFormValues(row: {
  name: string;
  clientId: string | null;
  type: SystemFormValues["type"];
  status: SystemFormValues["status"] | null;
  repoUrl: string | null;
}): SystemFormValues {
  return {
    name: row.name,
    clientId: row.clientId ?? "",
    type: row.type,
    status: row.status ?? "ACTIVE",
    repoUrl: row.repoUrl ?? "",
  };
}

export function formValuesToCreatePayload(
  values: SystemFormValues,
): CreateSystemPayload {
  return {
    name: values.name.trim(),
    clientId: values.clientId,
    type: values.type,
    status: values.status,
    ...(values.repoUrl.trim() ? { repoUrl: values.repoUrl.trim() } : {}),
  };
}

export function formValuesToUpdatePayload(
  values: SystemFormValues,
): UpdateSystemPayload {
  return {
    name: values.name.trim(),
    clientId: values.clientId,
    type: values.type,
    status: values.status,
    repoUrl: values.repoUrl.trim() === "" ? null : values.repoUrl.trim(),
  };
}
