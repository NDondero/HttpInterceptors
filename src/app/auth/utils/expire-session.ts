import { Router } from '@angular/router';
import { AuthService } from '../data-access/auth.service';

export function expireSession(auth: AuthService, router: Router): boolean {
  if (!auth.expireSession()) {
    return false;
  }

  void router.navigate(['/login'], {
    queryParams: { reason: 'sesión expirada, autentíquese nuevamente' },
  });
  return true;
}
