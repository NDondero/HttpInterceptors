import {
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../data-access/auth.service';
import { addAccessToken } from './access-token';
import { RETRY_WITH_REFRESH } from './auth-http-context';

export function retryWithNewToken(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  auth: AuthService,
): Observable<HttpEvent<unknown>> {
  const retryRequest = req.clone({
    context: req.context.set(RETRY_WITH_REFRESH, true),
  });

  return next(addAccessToken(retryRequest, auth));
}
