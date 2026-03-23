import dayjs from "dayjs";

export type ObligationDueTone = "overdue" | "upcoming" | "normal";

/** Vencida: antes de hoy. Próxima: hoy o dentro de 7 días (no vencida). */
export function obligationDueTone(dueIso: string): ObligationDueTone {
  const due = dayjs(dueIso).startOf("day");
  const today = dayjs().startOf("day");
  if (due.isBefore(today)) return "overdue";
  const daysUntil = due.diff(today, "day");
  if (daysUntil >= 0 && daysUntil <= 7) return "upcoming";
  return "normal";
}
