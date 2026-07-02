export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  supplierId: string | null;
  roles: string[];
  permissions: string[];
}
