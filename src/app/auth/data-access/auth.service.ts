import { computed, inject, Service, signal } from '@angular/core';
import { AuthResponse, LoginCredentials } from './auth.model';
import { HttpClient } from '@angular/common/http';
import { finalize, tap, throwError } from 'rxjs';

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

  private readonly _refreshing = signal(false);
  readonly refreshing = this._refreshing.asReadonly();

  login(credentials: LoginCredentials) {
    return this.http.post<AuthResponse>(this.authEndpoint + '/login', credentials).pipe(
      tap((tokens) => {
        this.saveTokens(tokens);
      }),
    );
  }

  logout() {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    this._accessToken.set(null);
    this.refreshToken.set(null);
  }

  refresh() {
    const refreshToken = this.refreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No hay token guardado para intentar refrescar la sesión'));
    }
    this._refreshing.set(true);
    return this.http.post<AuthResponse>(this.authEndpoint + '/refresh', { refreshToken }).pipe(
      tap((tokens) => {
        this.saveTokens(tokens);
      }),
      finalize(() => {
        this._refreshing.set(false);
      }),
    );
  }

  private saveTokens(tokens: AuthResponse) {
    const { accessToken, refreshToken } = tokens;

    localStorage.setItem(this.accessTokenKey, accessToken);
    this._accessToken.set(accessToken);

    localStorage.setItem(this.refreshTokenKey, refreshToken);
    this.refreshToken.set(refreshToken);
  }
}
