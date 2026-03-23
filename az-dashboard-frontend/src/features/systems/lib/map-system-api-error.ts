import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { t } from "@/lib/i18n";

const MAP: Record<string, string> = {
  CLIENT_NOT_FOUND: t.systems.errors.clientNotFound,
  SYSTEM_NOT_FOUND: t.systems.errors.systemNotFound,
};

export function mapSystemApiError(error: unknown): string {
  const fallback = t.toast.error;
  const raw = getApiErrorMessage(error, fallback).trim();
  return MAP[raw] ?? getApiErrorMessage(error, fallback);
}
