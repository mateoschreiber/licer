export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  lastName?: string | null;
  mustChangePassword?: boolean;
  supplierId: string | null;
  roles: string[];
  permissions: string[];
}
