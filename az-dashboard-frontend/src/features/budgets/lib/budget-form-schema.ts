import { z } from "zod";

import { evaluatePaymentPlan } from "./plan-validation";

const planItemSchema = z.object({
  type: z.enum(["PERCENTAGE", "FIXED"]),
  amount: z.string().trim().min(1, "Ingrese un monto o porcentaje"),
  dueDate: z.string().min(1, "Seleccione una fecha"),
});

export const createBudgetFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "El título debe tener al menos 2 caracteres"),
    clientId: z.string().min(1, "Seleccione un cliente"),
    currency: z.enum(["ARS", "USD"]),
    totalAmount: z
      .string()
      .trim()
      .min(1, "Ingrese el monto total")
      .superRefine((val, ctx) => {
        const n = Number.parseFloat(val.replace(",", "."));
        if (!Number.isFinite(n) || n <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "El monto total debe ser mayor a 0",
          });
        }
      }),
    paymentPlanItems: z
      .array(planItemSchema)
      .min(1, "Agregue al menos una cuota"),
  })
  .superRefine((data, ctx) => {
    const total = Number.parseFloat(data.totalAmount.replace(",", "."));
    const items = data.paymentPlanItems;

    items.forEach((item, index) => {
      const n = Number.parseFloat(item.amount.replace(",", "."));
      if (!Number.isFinite(n) || n <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Valor inválido",
          path: ["paymentPlanItems", index, "amount"],
        });
      } else if (item.type === "PERCENTAGE" && n > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El porcentaje no puede superar 100",
          path: ["paymentPlanItems", index, "amount"],
        });
      }
    });

    const ev = evaluatePaymentPlan(items, total);
    if (ev.onlyPercentage && !ev.percentageTotalOk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Los porcentajes deben sumar exactamente 100%",
        path: ["paymentPlanItems"],
      });
    }
    if (ev.hasFixed && !ev.fixedTotalOk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La suma de montos fijos no puede superar el total del presupuesto",
        path: ["paymentPlanItems"],
      });
    }
  });

export type CreateBudgetFormValues = z.infer<typeof createBudgetFormSchema>;

export function defaultCreateBudgetFormValues(): CreateBudgetFormValues {
  const today = new Date().toISOString().slice(0, 10);
  return {
    title: "",
    clientId: "",
    currency: "ARS",
    totalAmount: "",
    paymentPlanItems: [
      { type: "PERCENTAGE", amount: "100", dueDate: today },
    ],
  };
}

export const editBudgetFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "El título debe tener al menos 2 caracteres"),
  description: z.string(),
  currency: z.enum(["ARS", "USD"]),
  totalAmount: z
    .string()
    .trim()
    .min(1, "Ingrese el monto total")
    .superRefine((val, ctx) => {
      const n = Number.parseFloat(val.replace(",", "."));
      if (!Number.isFinite(n) || n <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El monto total debe ser mayor a 0",
        });
      }
    }),
});

export type EditBudgetFormValues = z.infer<typeof editBudgetFormSchema>;
