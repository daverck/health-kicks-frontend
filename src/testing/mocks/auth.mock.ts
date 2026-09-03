import { UserResponse } from '../../app/models/api.models';

export const MOCK_TOKEN = 'mock-jwt-token-xyz123';

export const mockUser: UserResponse = {
  id: 1,
  email: 'test@healthkicks.local',
  name: 'Testeur HealthKicks',
  avatar_url: null,
  role: 'user',
  is_active: true,
};

export const mockAdminUser: UserResponse = {
  id: 2,
  email: 'admin@healthkicks.local',
  name: 'Admin HealthKicks',
  avatar_url: null,
  role: 'admin',
  is_active: true,
};

export const mockLoginResponse = {
  access_token: MOCK_TOKEN,
  user: mockUser,
};

export const mockRegisterPayload = {
  email: 'newuser@healthkicks.local',
  password: 'SecurePassword123!',
  name: 'Nouveau Testeur',
};

