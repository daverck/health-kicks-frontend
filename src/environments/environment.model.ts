import { UserRole } from '../app/models/api.models';

export interface MockUserConfig {
  id: number;
  email: string;
  role: UserRole;
  name: string;
  token: string;
}

export interface AppEnvironment {
  production: boolean;
  apiUrl: string;
  mockAuth: boolean;
  mockUser?: MockUserConfig;
}
