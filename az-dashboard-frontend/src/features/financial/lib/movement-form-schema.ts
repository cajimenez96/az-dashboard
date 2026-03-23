import { z } from "zod";

import { PAYMENT_METHOD_CODES } from "../api/createMovement";

const movementTypes = ["INCOME", "EXPENSE"] as const;
const currencies = ["ARS", "USD"] as const;

export const movementFormSchema = z.object({
  type: z.enum(movementTypes),
  amount: z
    .string()
    .trim()
    .min(1, "Ingrese un monto")
    .superRefine((val, ctx) => {
      const normalized = val.replace(",", ".");
      const n = Number.parseFloat(normalized);
      if (!Number.isFinite(n) || n <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El monto debe ser mayor a 0",
        });
      }
    }),
  paymentMethod: z.enum(PAYMENT_METHOD_CODES),
  date: z.string().min(1, "Seleccione una fecha"),
  description: z.string(),
  clientId: z.string(),
  obligationId: z.string(),
  currency: z.enum(currencies),
});

export type MovementFormValues = z.infer<typeof movementFormSchema>;

export function defaultMovementFormValues(): MovementFormValues {
  const today = new Date().toISOString().slice(0, 10);
  return {
    type: "INCOME",
    amount: "",
    paymentMethod: "TRANSFER",
    date: today,
    description: "",
    clientId: "",
    obligationId: "",
    currency: "ARS",
  };
}

export function amountInputToApiString(raw: string): string {
  const normalized = raw.trim().replace(",", ".");
  const n = Number.parseFloat(normalized);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("Invalid amount");
  }
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export function dateInputToIso(dateYmd: string): string {
  return new Date(`${dateYmd}T12:00:00.000Z`).toISOString();
}
