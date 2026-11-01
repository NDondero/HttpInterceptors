import { HttpInterceptorFn } from '@angular/common/http';
import { delay } from 'rxjs';

export const delayInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith('/api/')) {
    return next(req).pipe(delay(500));
  }
  return next(req);
};
