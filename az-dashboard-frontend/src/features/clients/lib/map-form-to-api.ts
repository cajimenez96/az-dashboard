import type { CreateClientPayload, UpdateClientPayload } from "../api/types";
import type { ClientFormValues } from "./client-form-schema";

export function mapFormValuesToCreatePayload(
  values: ClientFormValues,
): CreateClientPayload {
  return {
    name: values.name.trim(),
    email: values.email.trim() || undefined,
    phone: values.phone.trim() || undefined,
    company: values.company.trim() || undefined,
    notes: values.notes.trim() || undefined,
    status: values.status,
  };
}

export function mapFormValuesToUpdatePayload(
  values: ClientFormValues,
): UpdateClientPayload {
  return {
    name: values.name.trim(),
    email: values.email,
    phone: values.phone,
    company: values.company,
    notes: values.notes,
    status: values.status,
  };
}
