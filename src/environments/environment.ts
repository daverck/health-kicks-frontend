import { AppEnvironment } from './environment.model';

export const environment: AppEnvironment = {
  production: true,
  apiUrl: 'https://api.healthkicks.eu',
  mockAuth: false,
};

export * from './environment.model';
