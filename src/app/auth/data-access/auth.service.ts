import { computed, inject, Service, signal } from '@angular/core';
import { AuthResponse, LoginCredentials } from './auth.model';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Service()
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authEndpoint = '/api/v1/auth';

  private readonly accessTokenKey = 'accessToken';
  private readonly refreshTokenKey = 'refreshToken';

  private readonly _accessToken = signal(localStorage.getItem(this.accessTokenKey));
  readonly accessToken = this._accessToken.asReadonly();
  readonly isAuthenticated = computed(() => !!this._accessToken());
  private readonly refreshToken = signal(localStorage.getItem(this.refreshTokenKey));

  private readonly errorChannel = signal('');
  readonly authError = this.errorChannel.asReadonly();

  async login(credentials: LoginCredentials) {
    try {
      const { accessToken, refreshToken } = await firstValueFrom(
        this.http.post<AuthResponse>(this.authEndpoint + '/login', credentials),
      );
      localStorage.setItem(this.accessTokenKey, accessToken);
      this._accessToken.set(accessToken);

      localStorage.setItem(this.refreshTokenKey, refreshToken);
      this.refreshToken.set(refreshToken);
    } catch (error) {
      this.errorChannel.set(`Error de autenticación: ${error}`);
    }
  }

  logout() {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    this._accessToken.set(null);
    this.refreshToken.set(null);
  }
}
