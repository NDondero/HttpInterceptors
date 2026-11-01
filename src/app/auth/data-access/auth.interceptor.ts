import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
  HttpStatusCode,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!req.url.startsWith('/api') || req.url.includes('/auth')) {
    return next(req);
  }

  const addToken = (req: HttpRequest<unknown>) => {
    const accessToken = auth.accessToken();

    return accessToken
      ? req.clone({
          setHeaders: { Authorization: `Bearer ${accessToken}` },
        })
      : req;
  };

  return next(addToken(req)).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === HttpStatusCode.Unauthorized) {
        return auth.refresh().pipe(
          switchMap(() => next(addToken(req))),
          catchError((refreshError) => {
            auth.logout();
            router.navigate(['/login'], {
              queryParams: { reason: 'sesión expirada, autentíquese nuevamente' },
            });
            return throwError(() => refreshError);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};
