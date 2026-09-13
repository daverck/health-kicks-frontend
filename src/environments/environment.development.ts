import { AppEnvironment } from './environment.model';

export const environment: AppEnvironment = {
  production: false,
  apiUrl: 'https://healthkicks.duckdns.org:8443',
  mockAuth: true,
  mockUser: {
    id: 1,
    email: 'serckdavid@gmail.com',
    role: 'admin',
    name: 'David Serck',
    token: 'mock-dev-jwt-token',
  },
};

export * from './environment.model';
