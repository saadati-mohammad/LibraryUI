import type { Mock } from "vitest";
import { HttpClient, provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';

import { authInterceptor, isApiRequest, resetSessionExpiredLatch } from './auth.interceptor';
import { AuthService } from '../service/auth.service';
import { environment } from '../../../environments/environment';

/** Builds an unsigned JWT with the given exp (seconds since epoch). */
function fakeJwt(expSeconds: number): string {
    const payload = btoa(JSON.stringify({ sub: 'admin', exp: expSeconds }))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `header.${payload}.signature`;
}

const VALID_TOKEN = fakeJwt(Math.floor(Date.now() / 1000) + 3600);
const PAGE_ORIGIN = location.origin;

/** Minimal Router stand-in: the interceptor only reads `url` and calls `navigate`. */
interface RouterStub {
    url: string;
    navigate: Mock;
}

describe('authInterceptor', () => {
    let httpMock: HttpTestingController;
    let router: RouterStub;

    function setup(options: {
        token?: string | null;
        url?: string;
    } = {}): void {
        resetSessionExpiredLatch();
        localStorage.clear();
        if (options.token) {
            localStorage.setItem('library.auth.token', options.token);
            localStorage.setItem('library.auth.user', 'admin');
        }

        router = {
            url: options.url ?? '/book',
            navigate: vi.fn().mockName('navigate').mockResolvedValue(true),
        };

        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withXhr(), withInterceptors([authInterceptor])),
                provideHttpClientTesting(),
                provideNoopAnimations(),
                { provide: Router, useValue: router },
            ],
        });

        httpMock = TestBed.inject(HttpTestingController);
    }

    /** Triggers the interceptor with a GET and returns the captured request. */
    function get(url: string) {
        TestBed.inject(HttpClient).get(url).subscribe({ error: () => undefined });
        return httpMock.expectOne(url);
    }

    afterEach(() => {
        // The `isApiRequest` cases below are pure-function tests and never call `setup()`,
        // so the controller may not exist yet.
        httpMock?.verify();
        localStorage.clear();
    });

    describe('token attachment', () => {
        it('attaches the bearer token to a relative API request', () => {
            setup({ token: VALID_TOKEN });
            const req = get(`${environment.apiUrl}/book`);
            expect(req.request.headers.get('Authorization')).toBe(`Bearer ${VALID_TOKEN}`);
            req.flush({});
        });

        it('attaches the bearer token to an absolute same-origin API request', () => {
            setup({ token: VALID_TOKEN });
            const req = get(`${PAGE_ORIGIN}${environment.apiUrl}/book`);
            expect(req.request.headers.get('Authorization')).toBe(`Bearer ${VALID_TOKEN}`);
            req.flush({});
        });

        it('sends no Authorization header when there is no token', () => {
            setup();
            const req = get(`${environment.apiUrl}/book`);
            expect(req.request.headers.has('Authorization')).toBe(false);
            req.flush({});
        });

        it('never leaks the token to non-API or cross-origin requests', () => {
            setup({ token: VALID_TOKEN });
            const client = TestBed.inject(HttpClient);

            client.get('/assets/config.json').subscribe();
            client.get('https://cdn.example.com/api/book').subscribe();

            for (const url of ['/assets/config.json', 'https://cdn.example.com/api/book']) {
                const req = httpMock.expectOne(url);
                expect(req.request.headers.has('Authorization')).toBe(false);
                req.flush({});
            }
        });
    });

    describe('401 handling', () => {
        it('clears the session and redirects once with the returnUrl and the expiry reason', () => {
            setup({ token: VALID_TOKEN, url: '/book' });
            const auth = TestBed.inject(AuthService);

            get(`${environment.apiUrl}/book`).flush('unauthorized', {
                status: 401,
                statusText: 'Unauthorized',
            });

            expect(auth.getToken()).toBeNull();
            expect(localStorage.getItem('library.auth.token')).toBeNull();
            // The notice moved off the snackbar (it dragged MatSnackBar into the initial
            // bundle) onto the login page, which reads `reason`.
            expect(router.navigate).toHaveBeenCalledTimes(1);
            // The notice moved off the snackbar (it dragged MatSnackBar into the initial
            // bundle) onto the login page, which reads `reason`.
            expect(router.navigate).toHaveBeenCalledWith(['/login'], {
                queryParams: { returnUrl: '/book', reason: 'session-expired' },
            });
        });

        it('redirects once for a burst of parallel 401s', () => {
            setup({ token: VALID_TOKEN, url: '/person' });
            const client = TestBed.inject(HttpClient);
            const urls = [`${environment.apiUrl}/book`, `${environment.apiUrl}/person`, `${environment.apiUrl}/loan`];

            for (const url of urls) {
                client.get(url).subscribe({ error: () => undefined });
            }
            for (const url of urls) {
                httpMock.expectOne(url).flush(null, { status: 401, statusText: 'Unauthorized' });
            }

            expect(router.navigate).toHaveBeenCalledTimes(1);
        });

        it('ignores a 401 from the login endpoint (wrong credentials, not an expiry)', () => {
            setup({ url: '/login' });
            TestBed.inject(HttpClient)
                .post(`${environment.apiUrl}/auth/login`, { username: 'admin', password: 'nope' })
                .subscribe({ error: () => undefined });

            httpMock
                .expectOne(`${environment.apiUrl}/auth/login`)
                .flush(null, { status: 401, statusText: 'Unauthorized' });

            expect(router.navigate).not.toHaveBeenCalled();
        });

        it('does not navigate when /login is already active (no redirect loop)', () => {
            setup({ token: VALID_TOKEN, url: '/login' });

            get(`${environment.apiUrl}/book`).flush(null, { status: 401, statusText: 'Unauthorized' });

            expect(router.navigate).not.toHaveBeenCalled();
        });

        it('leaves the session intact for non-401 errors', () => {
            setup({ token: VALID_TOKEN, url: '/book' });
            const auth = TestBed.inject(AuthService);

            get(`${environment.apiUrl}/book`).flush('boom', { status: 500, statusText: 'Server Error' });

            expect(auth.getToken()).toBe(VALID_TOKEN);
            expect(router.navigate).not.toHaveBeenCalled();
        });
    });

    describe('isApiRequest', () => {
        it('accepts relative and same-origin absolute API URLs', () => {
            expect(isApiRequest('/api/book', '/api')).toBe(true);
            expect(isApiRequest('/api', '/api')).toBe(true);
            expect(isApiRequest(`${PAGE_ORIGIN}/api/book`, '/api')).toBe(true);
            expect(isApiRequest('http://localhost:8079/api/book', 'http://localhost:8079/api')).toBe(true);
        });

        it('rejects paths outside the API base and every foreign origin', () => {
            expect(isApiRequest('/apix/book', '/api')).toBe(false);
            expect(isApiRequest('/assets/config.json', '/api')).toBe(false);
            expect(isApiRequest('https://evil.example.com/api/book', '/api')).toBe(false);
            // A relative request never reaches an absolute apiUrl's origin.
            expect(isApiRequest('/api/book', 'http://localhost:8079/api')).toBe(false);
        });
    });
});
