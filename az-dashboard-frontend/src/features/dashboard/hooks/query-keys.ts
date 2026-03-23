/** Claves compartidas para deduplicar peticiones en el panel. */
export const DASHBOARD_MOVEMENTS_QUERY_KEY = [
  "financial-movements",
  "dashboard",
] as const;

export const DASHBOARD_ACCEPTED_BUDGETS_QUERY_KEY = [
  "budgets",
  { status: "ACCEPTED" as const },
] as const;

export const DASHBOARD_PENDING_OBLIGATIONS_QUERY_KEY = [
  "obligations",
  { status: "PENDING" as const },
] as const;
