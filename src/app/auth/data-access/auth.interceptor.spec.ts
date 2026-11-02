import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let auth: AuthService;
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('accessToken', 'access-0');
    localStorage.setItem('refreshToken', 'refresh-0');
    router = { navigate: vi.fn().mockResolvedValue(true) };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('adds the Bearer token to protected relative API requests', () => {
    const pending = firstValueFrom(http.get('/api/users/me'));
    const request = httpTesting.expectOne('/api/users/me');

    expect(request.request.headers.get('Authorization')).toBe('Bearer access-0');
    request.flush({ id: 1 });
    void pending;
  });

  it('does not add a token outside protected API requests', () => {
    const pending = firstValueFrom(http.get('/assets/config.json'));
    const request = httpTesting.expectOne('/assets/config.json');

    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
    void pending;
  });

  it('refreshes once and retries the original request with the new token', async () => {
    localStorage.setItem('accessToken', 'old-access');
    localStorage.setItem('refreshToken', 'refresh-1');

    const pending = firstValueFrom(http.get('/api/users/me'));
    const original = httpTesting.expectOne('/api/users/me');
    original.flush({}, { status: 401, statusText: 'Unauthorized' });

    const refresh = httpTesting.expectOne('/api/v1/auth/refresh');
    refresh.flush({ accessToken: 'new-access', refreshToken: 'refresh-2' });

    const retry = httpTesting.expectOne('/api/users/me');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-access');
    retry.flush({ id: 1 });

    await expect(pending).resolves.toEqual({ id: 1 });
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('logs out and navigates once when concurrent refresh attempts fail', async () => {
    localStorage.setItem('accessToken', 'old-access');
    localStorage.setItem('refreshToken', 'refresh-1');

    const first = firstValueFrom(http.get('/api/users/first'));
    const second = firstValueFrom(http.get('/api/users/second'));
    const firstRequest = httpTesting.expectOne('/api/users/first');
    const secondRequest = httpTesting.expectOne('/api/users/second');
    firstRequest.flush({}, { status: 401, statusText: 'Unauthorized' });
    secondRequest.flush({}, { status: 401, statusText: 'Unauthorized' });

    const refresh = httpTesting.expectOne('/api/v1/auth/refresh');
    refresh.flush({}, { status: 500, statusText: 'Refresh failed' });

    await expect(first).rejects.toBeInstanceOf(HttpErrorResponse);
    await expect(second).rejects.toBeInstanceOf(HttpErrorResponse);
    expect(auth.accessToken()).toBeNull();
    expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { reason: 'sesión expirada, autentíquese nuevamente' },
    });
  });

  it('does not refresh or retry a login endpoint', () => {
    const pending = firstValueFrom(http.post('/api/v1/auth/login', {}));
    const request = httpTesting.expectOne('/api/v1/auth/login');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({ accessToken: 'unused', refreshToken: 'unused' });
    void pending;
  });

  it('expires the session after a retried request is unauthorized once more', async () => {
    localStorage.setItem('accessToken', 'old-access');
    localStorage.setItem('refreshToken', 'refresh-1');

    const pending = firstValueFrom(http.get('/api/users/me'));
    httpTesting.expectOne('/api/users/me').flush({}, {
      status: 401,
      statusText: 'Unauthorized',
    });
    httpTesting.expectOne('/api/v1/auth/refresh').flush({
      accessToken: 'new-access',
      refreshToken: 'refresh-2',
    });
    httpTesting.expectOne('/api/users/me').flush({}, {
      status: 401,
      statusText: 'Unauthorized',
    });

    await expect(pending).rejects.toBeInstanceOf(HttpErrorResponse);
    expect(auth.accessToken()).toBeNull();
    expect(router.navigate).toHaveBeenCalledTimes(1);
  });
});
