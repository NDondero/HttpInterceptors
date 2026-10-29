import { Component, effect, inject, signal } from '@angular/core';
import { AuthService } from './auth/data-access/auth.service';
import { Login } from './auth/features/login/login';

@Component({
  imports: [Login],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('HttpInterceptors');
  protected readonly auth = inject(AuthService);
  protected readonly loginVisible = signal(false);

  constructor() {
    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.loginVisible.set(false);
      }
    });
  }

  protected openLogin() {
    this.loginVisible.set(true);
  }

  protected logout() {
    this.auth.logout();
  }
}
