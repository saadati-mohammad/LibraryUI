import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MemberProfile } from '../model/public-catalog.model';

/** Response of POST /api/auth/login. */
export interface LoginResponse {
  token: string;
  username: string;
  role: string;
  expiresInSeconds: number;
}

const TOKEN_KEY = 'library.auth.token';
const USER_KEY = 'library.auth.user';
const ROLE_KEY = 'library.auth.role';

/**
 * Decodes one base64url JWT segment (header/payload) into a UTF-8 string.
 *
 * `atob` maps one output character per input byte, so a payload containing non-ASCII text
 * (e.g. a Persian `sub` or `name` claim) came back mojibake through the old
 * `decodeURIComponent(escape(atob(...)))` chain — and `escape`/`unescape` are deprecated
 * and absent from strict environments. Re-decoding the raw bytes with `TextDecoder` is the
 * standards-compliant, UTF-8-safe equivalent.
 *
 * The base64url alphabet is converted to standard base64 and re-padded, because `atob`
 * rejects the `-`/`_` alphabet and unpadded input.
 */
function decodeBase64UrlSegment(segment: string): string {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - (base64.length % 4)) % 4;
  const bytes = Uint8Array.from(atob(base64.padEnd(base64.length + padding, '=')), (char) =>
    char.charCodeAt(0),
  );
  return new TextDecoder().decode(bytes);
}

/**
 * Decodes a JWT and returns its payload claims, or null when the token is malformed.
 *
 * This is a client-side convenience only (expiry pre-check); the backend remains the
 * authority. Exported so the UTF-8 decoding behaviour is unit-testable on its own.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(decodeBase64UrlSegment(parts[1]));
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * Authentication state and JWT storage.
 *
 * The token is persisted in localStorage so a page refresh keeps the operator signed in.
 * `isAuthenticated` also verifies the stored token has not expired, so a stale token does
 * not leave the UI in a half-authenticated state that then 401s on every call.
 *
 * `username` and `role` are exposed as signals because the login response carries the
 * server-side role (there is a single backend account, so role cannot be inferred
 * client-side) and the UI needs it to decide what to show.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly tokenSignal = signal<string | null>(this.readToken());
  private readonly usernameSignal = signal<string | null>(this.readStored(USER_KEY));
  private readonly roleSignal = signal<string | null>(this.readStored(ROLE_KEY));

  readonly username = computed(() => this.usernameSignal());
  /** Server-declared role from the login response, or null when signed out. */
  readonly role = computed(() => this.roleSignal());
  readonly isAuthenticated = computed(() => {
    const token = this.tokenSignal();
    return token !== null && !this.isExpired(token);
  });

  private readonly http = inject(HttpClient);

  /** Exchange credentials for a JWT and persist the session. */
  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { username, password })
      .pipe(tap((res) => this.setSession(res)));
  }

  register(request: {firstName: string; lastName: string; email: string; nationalId: string; phone: string | null; password: string}): Observable<MemberProfile> {
    return this.http.post<MemberProfile>(`${environment.apiUrl}/auth/register`, request);
  }

  logout(): void {
    this.clearSession();
  }

  /** Current bearer token, or null when unauthenticated. */
  getToken(): string | null {
    const token = this.tokenSignal();
    if (token && this.isExpired(token)) {
      this.clearSession();
      return null;
    }
    return token;
  }

  private setSession(res: LoginResponse): void {
    this.writeStored(TOKEN_KEY, res.token);
    this.writeStored(USER_KEY, res.username);
    this.tokenSignal.set(res.token);
    this.usernameSignal.set(res.username);

    const role = res.role ?? null;
    if (role === null) {
      this.removeStored(ROLE_KEY);
    } else {
      this.writeStored(ROLE_KEY, role);
    }
    this.roleSignal.set(role);
  }

  private clearSession(): void {
    this.removeStored(TOKEN_KEY);
    this.removeStored(USER_KEY);
    this.removeStored(ROLE_KEY);
    this.tokenSignal.set(null);
    this.usernameSignal.set(null);
    this.roleSignal.set(null);
  }

  private readToken(): string | null {
    return this.readStored(TOKEN_KEY);
  }

  private readStored(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      // localStorage can throw in privacy modes; treat as unauthenticated.
      return null;
    }
  }

  private writeStored(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage unavailable (privacy mode / quota): the in-memory signal still holds the
      // session for this tab, so the app keeps working until the page is reloaded.
    }
  }

  private removeStored(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // See writeStored.
    }
  }

  /**
   * Checks the decoded payload's `exp` claim. This is a client-side convenience only —
   * the backend remains the authority and rejects expired tokens regardless.
   */
  private isExpired(token: string): boolean {
    const payload = decodeJwtPayload(token);
    const exp = payload?.['exp'];
    if (typeof exp !== 'number') {
      return true;
    }
    return exp * 1000 <= Date.now();
  }
}
