import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  {
    path: 'home',
    loadComponent: () => import('./landing/home/home'),
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/features/login/login'),
  },
  { path: '**', redirectTo: 'home' },
];
