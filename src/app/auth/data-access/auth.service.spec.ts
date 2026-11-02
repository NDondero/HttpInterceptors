import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { firstValueFrom } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('accessToken', 'access-0');
    localStorage.setItem('refreshToken', 'refresh-0');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('login stores both tokens and marks the session authenticated', async () => {
    const response = firstValueFrom(
      service.login({ username: 'ana', password: 'secret' }),
    );

    const request = httpTesting.expectOne('/api/v1/auth/login');
    expect(request.request.method).toBe('POST');
    request.flush({ accessToken: 'access-1', refreshToken: 'refresh-1' });

    await expect(response).resolves.toEqual({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
    });
    expect(service.accessToken()).toBe('access-1');
    expect(service.isAuthenticated()).toBe(true);
    expect(localStorage.getItem('accessToken')).toBe('access-1');
    expect(localStorage.getItem('refreshToken')).toBe('refresh-1');
  });

  it('logout clears the session and cancels an in-flight refresh', () => {
    localStorage.setItem('refreshToken', 'refresh-1');
    localStorage.setItem('accessToken', 'access-1');

    const firstRefresh = firstValueFrom(service.refresh());
    const request = httpTesting.expectOne('/api/v1/auth/refresh');
    service.logout();

    expect(request.cancelled).toBe(true);
    expect(service.accessToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    void firstRefresh.catch(() => undefined);
  });

  it('shares one refresh request between simultaneous subscribers', async () => {
    localStorage.setItem('refreshToken', 'refresh-1');
    const first = firstValueFrom(service.refresh());
    const second = firstValueFrom(service.refresh());

    const request = httpTesting.expectOne('/api/v1/auth/refresh');
    request.flush({ accessToken: 'access-2', refreshToken: 'refresh-2' });

    await expect(first).resolves.toBeTruthy();
    await expect(second).resolves.toBeTruthy();
    expect(service.accessToken()).toBe('access-2');
    expect(service.refreshing()).toBe(false);
  });

  it('does not start refresh without a stored refresh token', async () => {
    service.logout();
    await expect(firstValueFrom(service.refresh())).rejects.toThrow(
      'No hay token guardado para intentar refrescar la sesión',
    );
    httpTesting.expectNone('/api/v1/auth/refresh');
  });

  it('ignores a login response completed after logout', async () => {
    localStorage.setItem('refreshToken', 'refresh-1');
    localStorage.setItem('accessToken', 'access-1');

    const login = firstValueFrom(
      service.login({ username: 'ana', password: 'secret' }),
    );
    const request = httpTesting.expectOne('/api/v1/auth/login');
    service.logout();
    request.flush({ accessToken: 'late-access', refreshToken: 'late-refresh' });

    await login.catch(() => undefined);
    expect(service.accessToken()).toBeNull();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });
});
