import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  if (req.url.includes('http://localhost:8081') && !req.url.includes('auth')) {
    return next(
      req.clone({
        setHeaders: { Authorization: `Bearer ${auth.accessToken()}` },
      }),
    );
  }
  return next(req);
};
