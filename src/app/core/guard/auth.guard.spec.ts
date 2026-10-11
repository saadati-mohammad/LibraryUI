import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { authGuard } from './auth.guard';

/** Builds an unsigned JWT with the given exp (seconds since epoch). */
function fakeJwt(expSeconds: number): string {
  const payload = btoa(JSON.stringify({ sub: 'admin', exp: expSeconds }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `header.${payload}.signature`;
}

const ROUTE = {} as ActivatedRouteSnapshot;

describe('authGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
  });

  afterEach(() => localStorage.clear());

  function run(url: string): boolean | UrlTree {
    return TestBed.runInInjectionContext(() =>
      authGuard(ROUTE, { url } as RouterStateSnapshot),
    ) as boolean | UrlTree;
  }

  it('lets an authenticated operator through', () => {
    localStorage.setItem('library.auth.token', fakeJwt(Math.floor(Date.now() / 1000) + 3600));
    TestBed.inject(Router);

    expect(run('/book')).toBe(true);
  });

  it('redirects to /login and preserves the attempted URL', () => {
    TestBed.inject(Router);

    const result = run('/book');

    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/login?returnUrl=%2Fbook');
  });

  it('preserves a deep URL including its query string', () => {
    TestBed.inject(Router);

    const result = run('/loan?status=OVERDUE&page=2');

    expect((result as UrlTree).toString()).toBe(
      '/login?returnUrl=%2Floan%3Fstatus%3DOVERDUE%26page%3D2',
    );
  });

  it('treats an expired token as unauthenticated', () => {
    localStorage.setItem('library.auth.token', fakeJwt(Math.floor(Date.now() / 1000) - 60));
    TestBed.inject(Router);

    const result = run('/book');

    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/login?returnUrl=%2Fbook');
  });
});
