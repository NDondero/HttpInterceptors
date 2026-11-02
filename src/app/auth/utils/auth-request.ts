import { HttpRequest } from '@angular/common/http';

export function isAuthRequest(req: HttpRequest<unknown>): boolean {
  const url = new URL(req.urlWithParams, 'http://angular.local');
  return /^\/api\/(?:v\d+\/)?auth(?:\/|$)/.test(url.pathname);
}

export function isProtectedApiRequest(req: HttpRequest<unknown>): boolean {
  const url = new URL(req.urlWithParams, 'http://angular.local');
  const isApiPath = url.pathname === '/api' || url.pathname.startsWith('/api/');

  if (!isApiPath || isAuthRequest(req)) {
    return false;
  }

  const isAbsoluteRequest =
    /^[a-z][a-z\d+.-]*:/i.test(req.url) || req.url.startsWith('//');

  if (!isAbsoluteRequest) {
    return true;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  return url.origin === window.location.origin;
}
