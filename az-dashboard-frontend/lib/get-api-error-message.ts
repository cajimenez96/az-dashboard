import { isAxiosError } from "axios";

export function getApiErrorMessage(
  error: unknown,
  fallback = "Ocurrió un error. Intente nuevamente.",
): string {
  if (!isAxiosError(error)) {
    return fallback;
  }
  const data = error.response?.data as
    | { message?: string | string[] }
    | undefined;
  if (typeof data?.message === "string") {
    return data.message;
  }
  if (Array.isArray(data?.message)) {
    return data.message.join(", ");
  }
  if (error.response?.status === 404) {
    return "No se encontró el recurso.";
  }
  return fallback;
}
