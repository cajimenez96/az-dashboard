/** Convierte entrada numérica del formulario al string decimal que espera el backend. */
export function amountToApiString(raw: string): string {
  const normalized = raw.trim().replace(",", ".");
  const n = Number.parseFloat(normalized);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("INVALID_AMOUNT");
  }
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}
