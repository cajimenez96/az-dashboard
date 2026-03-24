import { isAxiosError } from "axios";

/** Normalizes NestJS / class-validator error payloads. */
export function getApiErrorCode(error: unknown): string | null {
  if (!isAxiosError(error)) return null;
  const raw = error.response?.data;
  if (!raw || typeof raw !== "object") return null;
  const msg = (raw as { message?: unknown }).message;
  if (typeof msg === "string") return msg;
  if (Array.isArray(msg) && typeof msg[0] === "string") return msg[0];
  return null;
}
