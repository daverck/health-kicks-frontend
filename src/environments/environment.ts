import { AppEnvironment } from './environment.model';

export const environment: AppEnvironment = {
  production: true,
  apiUrl: 'https://healthkicks.duckdns.org:8443',
  mockAuth: false,
};

export * from './environment.model';
