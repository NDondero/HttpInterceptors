import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpStatusCode,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { addAccessToken } from '../utils/access-token';
import { RETRY_WITH_REFRESH } from '../utils/auth-http-context';
import { isProtectedApiRequest } from '../utils/auth-request';
import { expireSession } from '../utils/expire-session';
import { retryWithNewToken } from '../utils/retry-request';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!isProtectedApiRequest(req)) {
    return next(req);
  }

  return next(addAccessToken(req, auth)).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === HttpStatusCode.Unauthorized) {
        if (req.context.get(RETRY_WITH_REFRESH)) {
          expireSession(auth, router);
          return throwError(() => error);
        }

        return auth.refresh().pipe(
          switchMap(() => retryWithNewToken(req, next, auth)),
          catchError((refreshError) => {
            expireSession(auth, router);
            return throwError(() => refreshError);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};
