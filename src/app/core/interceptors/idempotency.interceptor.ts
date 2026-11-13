import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

const IDEMPOTENT_METHODS = new Set(['POST', 'PUT', 'PATCH']);

const IDEMPOTENT_PATH_PATTERNS = [
  /\/api\/v1\/fall-alerts(\/|$)/,
  /\/api\/v1\/users\/me\/alert-contacts(\/|$)/,
  /\/api\/v1\/studio\/sessions(\/|$)/,
  /\/api\/v1\/steps(\/|$)/,
  /\/commands\/studio\/start(\/|$)/,
];

export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(16).substring(2, 14)}`;
}

export function isIdempotentTargetRequest(method: string, url: string): boolean {
  if (!IDEMPOTENT_METHODS.has(method.toUpperCase())) {
    return false;
  }
  if (!url.startsWith(environment.apiUrl)) {
    return false;
  }
  return IDEMPOTENT_PATH_PATTERNS.some((pattern) => pattern.test(url));
}

/**
 * Attaches a deterministic Idempotency-Key header on mutating Fall Alert,
 * Emergency Contact, Steps, and Studio Session API requests when not already set.
 * Placed before authInterceptor so 401 token-refresh retries preserve the same key.
 */
export const idempotencyInterceptor: HttpInterceptorFn = (req, next) => {
  if (isIdempotentTargetRequest(req.method, req.url) && !req.headers.has('Idempotency-Key')) {
    const clonedReq = req.clone({
      setHeaders: {
        'Idempotency-Key': generateIdempotencyKey(),
      },
    });
    return next(clonedReq);
  }
  return next(req);
};
