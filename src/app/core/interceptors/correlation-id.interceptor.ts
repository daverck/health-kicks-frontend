import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export function generateCorrelationId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '');
  }
  return Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2);
}

/**
 * Injects a unique X-Correlation-ID header on all outgoing API requests
 * for distributed tracing and cross-service observability.
 */
export const correlationIdInterceptor: HttpInterceptorFn = (req, next) => {
  const isApiRequest = req.url.startsWith(environment.apiUrl);
  if (isApiRequest && !req.headers.has('X-Correlation-ID')) {
    const correlationId = generateCorrelationId();
    const clonedReq = req.clone({
      setHeaders: {
        'X-Correlation-ID': correlationId,
      },
    });
    return next(clonedReq);
  }
  return next(req);
};

