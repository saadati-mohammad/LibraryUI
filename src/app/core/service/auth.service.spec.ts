import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService, LoginResponse } from './auth.service';
import { environment } from '../../../environments/environment';

/** Builds an unsigned JWT with the given exp (seconds since epoch). */
function fakeJwt(expSeconds: number): string {
  const payload = btoa(JSON.stringify({ sub: 'admin', exp: expSeconds }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `header.${payload}.signature`;
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('starts unauthenticated', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.getToken()).toBeNull();
  });

  it('stores the token and marks the session authenticated after login', () => {
    const response: LoginResponse = {
      token: fakeJwt(Math.floor(Date.now() / 1000) + 3600),
      username: 'admin',
      role: 'ADMIN',
      expiresInSeconds: 3600,
    };

    service.login('admin', 'secret').subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(response);

    expect(service.isAuthenticated()).toBe(true);
    expect(service.username()).toBe('admin');
    expect(service.getToken()).toBe(response.token);
  });

  it('treats an expired stored token as unauthenticated', () => {
    localStorage.setItem('library.auth.token', fakeJwt(Math.floor(Date.now() / 1000) - 10));
    // Fresh service instance reads the persisted (expired) token.
    const fresh = TestBed.inject(AuthService);
    expect(fresh.isAuthenticated()).toBe(false);
    expect(fresh.getToken()).toBeNull();
  });

  it('clears the session on logout', () => {
    localStorage.setItem('library.auth.token', fakeJwt(Math.floor(Date.now() / 1000) + 3600));
    service.logout();
    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('library.auth.token')).toBeNull();
  });
});
