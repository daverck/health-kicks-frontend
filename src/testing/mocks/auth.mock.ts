import { UserResponse } from '../../app/models/api.models';

export const MOCK_TOKEN = 'mock-jwt-token-xyz123';

export const mockUser: UserResponse = {
  uuid: '00000000-0000-0000-0000-000000000001',
  pseudonym: 'SUBJ-USR-0001',
  email: 'test@healthkicks.local',
  name: 'Testeur HealthKicks',
  avatar_url: null,
  role: 'user',
  is_active: true,
};

export const mockAdminUser: UserResponse = {
  uuid: '00000000-0000-0000-0000-000000000002',
  pseudonym: 'SUBJ-ADM-0002',
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

