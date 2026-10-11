import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../service/auth.service';
import { SESSION_EXPIRED_REASON } from '../service/session-notice.service';

/**
 * Latches after the first 401 of a burst. Parallel API calls all fail with 401 within the
 * same tick, and the operator must land on /login once — not N times.
 *
 * It is re-armed (cleared) by any request that carries a live token, i.e. once the operator
 * signs in again, so a later expiry still notifies.
 */
let sessionExpiredHandled = false;

/**
 * Test seam: clears the single-notice latch so specs that each simulate a fresh session
 * expiry start from a known state. Production code never calls this — a live token re-arms
 * the latch on its own.
 */
export function resetSessionExpiredLatch(): void {
  sessionExpiredHandled = false;
}

/**
 * Resolves a URL that may be relative (`/api/book`) or absolute
 * (`http://localhost:8079/api/book`) so both forms can be compared. Relative URLs resolve
 * against the document base URL, exactly as the browser would resolve them. Returns null
 * when the value is not a usable URL.
 */
function toUrl(url: string): URL | null {
  const base = typeof document === 'undefined' ? 'http://localhost' : document.baseURI;
  try {
    return new URL(url, base);
  } catch {
    return null;
  }
}

/**
 * True when `url` targets the configured API base, in either of its two shapes.
 *
 * The app builds every call from `environment.apiUrl`, which is relative in dev/prod
 * (`/api`) but may be absolute in another deployment, so both the request and the base can
 * be relative or absolute and the comparison is done on the resolved URL.
 *
 * A request to a *different origin* is never treated as an API request even when its path
 * shares the `/api` prefix — otherwise an absolute call to `https://third-party/api/...`
 * would receive the bearer token.
 */
export function isApiRequest(url: string, apiUrl: string = environment.apiUrl): boolean {
  const base = toUrl(apiUrl);
  const target = toUrl(url);
  if (!base || !target || base.origin !== target.origin) {
    return false;
  }

  // An absolute apiUrl with a relative request URL would be sent to the *page* origin by
  // the browser, not to the API origin, so it is not an API request.
  const baseIsAbsolute = !apiUrl.startsWith('/');
  if (baseIsAbsolute && url.startsWith('/')) {
    return false;
  }

  const basePath = base.pathname.replace(/\/$/, '');
  return target.pathname === basePath || target.pathname.startsWith(`${basePath}/`);
}

/** True for the login endpoint, whose 401 means "wrong credentials", not "session ended". */
export function isAuthEndpoint(url: string): boolean {
  const path = toUrl(url)?.pathname ?? url;
  return path.endsWith('/auth/login');
}

/**
 * Clears the dead session, tells the operator once, and returns them to the login screen.
 *
 * Two loop guards: the login endpoint's own 401 never reaches here (see the interceptor),
 * and navigation is skipped when /login is already the active route. The latch means a
 * burst of parallel 401s produces exactly one redirect.
 *
 * The notice itself is **not** rendered from here. Opening a `MatSnackBar` pulled the
 * whole Material snackbar overlay (and its portal/animation machinery) into the initial
 * bundle for a message this rarely needed. The signal is now the `reason` query param the
 * login page reads and renders inline — same one-message guarantee, ~16 kB less on first
 * paint. A bare `/login` (no `returnUrl`) still carries the reason.
 */
function handleSessionExpiry(auth: AuthService, router: Router): void {
  auth.logout();

  if (sessionExpiredHandled) {
    return;
  }
  sessionExpiredHandled = true;

  if (!router.url.startsWith('/login')) {
    void router.navigate(['/login'], {
      queryParams: { returnUrl: router.url, reason: SESSION_EXPIRED_REASON },
    });
  }
}

/**
 * Attaches the bearer token to API requests and signs the user out on a 401.
 *
 * Only requests targeting the configured API base are touched, so third-party or asset
 * requests never leak the token. A 401 (expired/invalid session) clears the stored session
 * and returns the user to the login screen exactly once, unless they are already there.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = isApiRequest(req.url) ? auth.getToken() : null;

  if (token !== null) {
    // A live session exists: re-arm the expiry notice for whenever it ends.
    sessionExpiredHandled = false;
  }

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      const isUnauthorized = error instanceof HttpErrorResponse && error.status === 401;

      if (isUnauthorized && !isAuthEndpoint(req.url)) {
        handleSessionExpiry(auth, router);
      }
      return throwError(() => error);
    })
  );
};
