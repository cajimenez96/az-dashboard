export type ClientStatus = "ACTIVE" | "INACTIVE" | "AT_RISK";

export interface ClientListItem {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  notes?: string | null;
  status: ClientStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateClientPayload {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  status?: ClientStatus;
}

export type UpdateClientPayload = Partial<CreateClientPayload>;
