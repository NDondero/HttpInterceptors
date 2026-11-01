import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { delayInterceptor } from './dev/delay.interceptor';
import { authorizationInterceptor } from './auth/data-access/authorization.interceptor';
import { unauthorizedInterceptor } from './auth/data-access/unauthorized.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withInterceptors([delayInterceptor, authorizationInterceptor, unauthorizedInterceptor]),
    ),
  ],
};
