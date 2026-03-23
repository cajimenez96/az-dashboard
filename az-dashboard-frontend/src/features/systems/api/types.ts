export type SystemType = "SAAS" | "CUSTOM";

export type SystemStatus = "ACTIVE" | "MAINTENANCE" | "DEPRECATED";

export interface SystemListItem {
  id: string;
  name: string;
  type: SystemType;
  status: SystemStatus | null;
  repoUrl: string | null;
  clientId: string | null;
  createdAt: string;
  updatedAt: string;
  client: { id: string; name: string } | null;
}

export interface CreateSystemPayload {
  name: string;
  clientId: string;
  type: SystemType;
  status?: SystemStatus;
  repoUrl?: string;
}

export interface UpdateSystemPayload {
  name?: string;
  clientId?: string;
  type?: SystemType;
  status?: SystemStatus;
  /** Cadena vacía o null limpia el repositorio en el servidor */
  repoUrl?: string | null;
}
