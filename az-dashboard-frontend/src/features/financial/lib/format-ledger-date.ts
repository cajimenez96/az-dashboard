import dayjs from "dayjs";

/** dd/mm/yyyy for ledger UI */
export function formatLedgerDate(iso: string): string {
  return dayjs(iso).format("DD/MM/YYYY");
}
