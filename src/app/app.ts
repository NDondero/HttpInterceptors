import { Component, inject, signal } from '@angular/core';
import { AuthService } from './auth/data-access/auth.service';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterOutlet, RouterLink],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('HttpInterceptors');
  protected readonly auth = inject(AuthService);
}
