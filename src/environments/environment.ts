import { AppEnvironment } from './environment.model';

export const environment: AppEnvironment = {
  production: true,
  apiUrl: 'https://api.healthkicks.eu',
  mockAuth: false,
  mockData: false,
  sentryDsn: 'https://5119e621f30c735a9a2149e5e9eddef6@o4512458563780608.ingest.de.sentry.io/4512458604609616',
};

export * from './environment.model';
