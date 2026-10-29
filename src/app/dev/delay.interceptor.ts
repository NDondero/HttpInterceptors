import { HttpInterceptorFn } from '@angular/common/http';
import { delay } from 'rxjs';

export const delayInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('http://localhost:8081')) {
    return next(req).pipe(delay(1000));
  }
  return next(req);
};
