import { z } from "zod";

import type { ClientListItem } from "../api/types";

export const clientFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z
    .string()
    .trim()
    .superRefine((val, ctx) => {
      if (val.length === 0) return;
      const parsed = z.string().email().safeParse(val);
      if (!parsed.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Ingrese un correo electrónico válido",
        });
      }
    }),
  phone: z.string().trim(),
  company: z.string().trim(),
  notes: z.string().trim(),
  status: z.enum(["ACTIVE", "INACTIVE", "AT_RISK"]),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;

export function clientToFormValues(client: ClientListItem): ClientFormValues {
  return {
    name: client.name,
    email: client.email ?? "",
    phone: client.phone ?? "",
    company: client.company ?? "",
    notes: client.notes ?? "",
    status: client.status,
  };
}

export const defaultClientFormValues: ClientFormValues = {
  name: "",
  email: "",
  phone: "",
  company: "",
  notes: "",
  status: "ACTIVE",
};
