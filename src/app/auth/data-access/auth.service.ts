import { computed, inject, Service, signal } from '@angular/core';
import { AuthResponse, LoginCredentials } from './auth.model';
import { HttpClient } from '@angular/common/http';
import {
  finalize,
  Observable,
  shareReplay,
  Subject,
  takeUntil,
  tap,
  throwError,
} from 'rxjs';

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
  private refreshInFlight: Observable<AuthResponse> | null = null;
  private refreshCancellation = new Subject<void>();
  private sessionGeneration = 0;
  private sessionExpired = false;

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    const loginGeneration = this.sessionGeneration;
    return this.http.post<AuthResponse>(this.authEndpoint + '/login', credentials).pipe(
      tap((tokens) => {
        if (loginGeneration === this.sessionGeneration) {
          this.saveTokens(tokens);
        }
      }),
    );
  }

  logout(): void {
    this.invalidateSession();
    this.sessionExpired = false;
  }

  expireSession(): boolean {
    if (this.sessionExpired) {
      return false;
    }

    const hasTokens = !!this._accessToken() || !!this.refreshToken();
    if (!hasTokens) {
      return false;
    }

    this.sessionExpired = true;
    this.invalidateSession();
    return true;
  }

  private invalidateSession(): void {
    this.sessionGeneration++;
    this.refreshCancellation.next();
    this.refreshCancellation = new Subject<void>();
    this._refreshing.set(false);
    this.refreshInFlight = null;
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    this._accessToken.set(null);
    this.refreshToken.set(null);
  }

  refresh(): Observable<AuthResponse> {
    const refreshToken = this.refreshToken();
    if (!refreshToken) {
      return throwError(
        () => new Error('No hay token guardado para intentar refrescar la sesión'),
      );
    }
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    this._refreshing.set(true);
    const refreshGeneration = this.sessionGeneration;
    const refreshCancellation = this.refreshCancellation;
    const refreshInFlight = this.http
      .post<AuthResponse>(this.authEndpoint + '/refresh', { refreshToken })
      .pipe(
        tap((tokens) => {
          if (refreshGeneration === this.sessionGeneration) {
            this.saveTokens(tokens);
          }
        }),
        takeUntil(refreshCancellation),
        finalize(() => {
          if (refreshGeneration === this.sessionGeneration) {
            this._refreshing.set(false);
            this.refreshInFlight = null;
          }
        }),
        shareReplay({ bufferSize: 1, refCount: true }),
      );
    this.refreshInFlight = refreshInFlight;
    return refreshInFlight;
  }

  private saveTokens(tokens: AuthResponse): void {
    const { accessToken, refreshToken } = tokens;

    localStorage.setItem(this.accessTokenKey, accessToken);
    this._accessToken.set(accessToken);

    localStorage.setItem(this.refreshTokenKey, refreshToken);
    this.refreshToken.set(refreshToken);
    this.sessionExpired = false;
  }
}
