import { z } from "zod";

import type { CreateUserPayload, UpdateUserPayload } from "../api/types";

const roles = ["SUPERADMIN", "USER"] as const;
const profiles = ["MARKETER", "DEVELOPER"] as const;

/** Mínimo 8 caracteres — alineado con el backend (CreateUserDto). */
const PASSWORD_MIN = 8;

export const createUserFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().trim().email("Ingrese un correo electrónico válido"),
  password: z
    .string()
    .min(
      PASSWORD_MIN,
      `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`,
    ),
  role: z.enum(roles),
  profile: z.enum(profiles),
});

export type CreateUserFormValues = z.infer<typeof createUserFormSchema>;

export function defaultCreateUserFormValues(): CreateUserFormValues {
  return {
    name: "",
    email: "",
    password: "",
    role: "USER",
    profile: "MARKETER",
  };
}

export function createFormToPayload(
  values: CreateUserFormValues,
): CreateUserPayload {
  return {
    name: values.name.trim(),
    email: values.email.trim().toLowerCase(),
    password: values.password,
    role: values.role,
    profile: values.profile,
  };
}

export const editUserFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres"),
  role: z.enum(roles),
  profile: z.enum(profiles),
});

export type EditUserFormValues = z.infer<typeof editUserFormSchema>;

export function userToEditFormValues(row: {
  name: string;
  role: EditUserFormValues["role"];
  profile: EditUserFormValues["profile"];
}): EditUserFormValues {
  return {
    name: row.name,
    role: row.role,
    profile: row.profile,
  };
}

export function editFormToPayload(
  values: EditUserFormValues,
): UpdateUserPayload {
  return {
    name: values.name.trim(),
    role: values.role,
    profile: values.profile,
  };
}
