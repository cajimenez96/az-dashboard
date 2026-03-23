/** Convierte valor de input type="date" a ISO para la API. */
export function dateInputToIso(dateYmd: string): string {
  return new Date(`${dateYmd}T12:00:00.000Z`).toISOString();
}
