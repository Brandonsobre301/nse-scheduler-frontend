export type UserRole = 'admin' | 'manager' | 'viewer';

export interface User {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}