import { ApplicationConfig, ErrorHandler, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import * as Sentry from '@sentry/angular';

import { routes } from './app.routes';
import { correlationIdInterceptor } from './core/interceptors/correlation-id.interceptor';
import { idempotencyInterceptor } from './core/interceptors/idempotency.interceptor';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { mockDataInterceptor } from './core/interceptors/mock-data.interceptor';
import { AuthService } from './core/services/auth.service';
import { MockAuthService } from './core/services/mock-auth.service';
import { environment } from '../environments/environment';
import { provideClientHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        correlationIdInterceptor,
        idempotencyInterceptor,
        authInterceptor,
        ...(environment.mockData ? [mockDataInterceptor] : []),
      ]),
    ),
    ...(environment.mockAuth
      ? [{ provide: AuthService, useClass: MockAuthService }]
      : []),
    ...(environment.sentryDsn
      ? [{ provide: ErrorHandler, useValue: Sentry.createErrorHandler() }]
      : []),
    provideClientHydration(),
  ],
};
