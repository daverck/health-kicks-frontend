import { AppEnvironment } from './environment.model';

export const environment: AppEnvironment = {
  production: false,
  apiUrl: 'https://api.healthkicks.eu',
  mockAuth: true,
  mockUser: {
    uuid: '00000000-0000-0000-0000-000000000001',
    pseudonym: 'SUBJ-DEV-0001',
    email: 'serckdavid@gmail.com',
    role: 'admin',
    name: 'David Serck',
    token: 'mock-dev-jwt-token',
  },
};

export * from './environment.model';
