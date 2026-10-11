import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { AuthService, LoginResponse, decodeJwtPayload } from './auth.service';
import { environment } from '../../../environments/environment';

/** Builds an unsigned JWT with the given exp (seconds since epoch). */
function fakeJwt(expSeconds: number): string {
  const payload = btoa(JSON.stringify({ sub: 'admin', exp: expSeconds }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `header.${payload}.signature`;
}

/**
 * Builds a JWT whose payload is UTF-8 encoded (not the Latin-1 that `btoa` accepts), so
 * non-ASCII claims round-trip only if the decoder is genuinely UTF-8 aware.
 */
function utf8Jwt(payload: Record<string, unknown>): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  const segment = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `header.${segment}.signature`;
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  /**
   * Builds a second instance. `TestBed.inject` would return the already-cached root
   * instance, which read localStorage at construction time; a new instance re-reads the
   * persisted session, which is what "returning session" behaviour is about.
   */
  function freshService(): AuthService {
    return TestBed.runInInjectionContext(() => new AuthService());
  }

  it('starts unauthenticated', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.getToken()).toBeNull();
    expect(service.username()).toBeNull();
    expect(service.role()).toBeNull();
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

  it('stores and exposes the role from the login response', () => {
    service.login('admin', 'secret').subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush({
      token: fakeJwt(Math.floor(Date.now() / 1000) + 3600),
      username: 'admin',
      role: 'LIBRARIAN',
      expiresInSeconds: 3600,
    } satisfies LoginResponse);

    expect(service.role()).toBe('LIBRARIAN');
    expect(localStorage.getItem('library.auth.role')).toBe('LIBRARIAN');
  });

  it('drops the stored role on logout', () => {
    service.login('admin', 'secret').subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush({
      token: fakeJwt(Math.floor(Date.now() / 1000) + 3600),
      username: 'admin',
      role: 'ADMIN',
      expiresInSeconds: 3600,
    } satisfies LoginResponse);

    service.logout();

    expect(service.role()).toBeNull();
    expect(localStorage.getItem('library.auth.role')).toBeNull();
  });

  it('restores username and role from storage for a returning session', () => {
    localStorage.setItem('library.auth.token', fakeJwt(Math.floor(Date.now() / 1000) + 3600));
    localStorage.setItem('library.auth.user', 'admin');
    localStorage.setItem('library.auth.role', 'ADMIN');

    const restored = freshService();

    expect(restored.username()).toBe('admin');
    expect(restored.role()).toBe('ADMIN');
    expect(restored.isAuthenticated()).toBe(true);
  });

  it('treats an expired stored token as unauthenticated', () => {
    localStorage.setItem('library.auth.token', fakeJwt(Math.floor(Date.now() / 1000) - 10));
    // Fresh service instance reads the persisted (expired) token.
    const fresh = freshService();
    expect(fresh.isAuthenticated()).toBe(false);
    expect(fresh.getToken()).toBeNull();
  });

  it('clears the session on logout', () => {
    localStorage.setItem('library.auth.token', fakeJwt(Math.floor(Date.now() / 1000) + 3600));
    service.logout();
    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('library.auth.token')).toBeNull();
  });

  describe('decodeJwtPayload', () => {
    it('decodes base64url claims, including non-ASCII (UTF-8) values', () => {
      const payload = decodeJwtPayload(utf8Jwt({ sub: 'مدیر', name: 'کتابخانه', exp: 123 }));

      expect(payload?.['sub']).toBe('مدیر');
      expect(payload?.['name']).toBe('کتابخانه');
      expect(payload?.['exp']).toBe(123);
    });

    it('returns null for structurally invalid tokens', () => {
      expect(decodeJwtPayload('not-a-jwt')).toBeNull();
      expect(decodeJwtPayload('a.!!!.c')).toBeNull();
    });

    it('accepts a UTF-8 token end to end (expiry check reads the decoded exp)', () => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      localStorage.setItem('library.auth.token', utf8Jwt({ sub: 'مدیر', exp }));

      const fresh = freshService();

      expect(fresh.isAuthenticated()).toBe(true);
    });
  });
});
