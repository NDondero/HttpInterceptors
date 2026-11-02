import { HttpRequest } from '@angular/common/http';
import { AuthService } from '../data-access/auth.service';

export function addAccessToken(
  req: HttpRequest<unknown>,
  auth: AuthService,
): HttpRequest<unknown> {
  const accessToken = auth.accessToken();

  return accessToken
    ? req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
    : req;
}
