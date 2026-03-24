import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { t } from "@/lib/i18n";

const MAP: Record<string, string> = {
  EMAIL_ALREADY_EXISTS: t.users.errors.emailExists,
  USER_NOT_FOUND: t.users.errors.userNotFound,
};

export function mapUserApiError(error: unknown): string {
  const fallback = t.toast.error;
  const raw = getApiErrorMessage(error, fallback).trim();
  return MAP[raw] ?? getApiErrorMessage(error, fallback);
}
