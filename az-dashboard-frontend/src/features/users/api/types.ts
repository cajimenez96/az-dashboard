export type UserRole = "SUPERADMIN" | "USER";

export type UserProfile = "MARKETER" | "DEVELOPER";

export interface UserListItem {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profile: UserProfile;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  email: string;
  name: string;
  password: string;
  role: UserRole;
  profile: UserProfile;
}

export interface UpdateUserPayload {
  name?: string;
  role?: UserRole;
  profile?: UserProfile;
}
