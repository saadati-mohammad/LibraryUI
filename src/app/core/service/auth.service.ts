import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Response of POST /api/auth/login. */
export interface LoginResponse {
  token: string;
  username: string;
  role: string;
  expiresInSeconds: number;
}

const TOKEN_KEY = 'library.auth.token';
const USER_KEY = 'library.auth.user';

/**
 * Authentication state and JWT storage.
 *
 * The token is persisted in localStorage so a page refresh keeps the operator signed in.
 * `isAuthenticated` also verifies the stored token has not expired, so a stale token does
 * not leave the UI in a half-authenticated state that then 401s on every call.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly tokenSignal = signal<string | null>(this.readToken());
  private readonly usernameSignal = signal<string | null>(this.readStored(USER_KEY));

  readonly username = computed(() => this.usernameSignal());
  readonly isAuthenticated = computed(() => {
    const token = this.tokenSignal();
    return token !== null && !this.isExpired(token);
  });

  constructor(private readonly http: HttpClient) {}

  /** Exchange credentials for a JWT and persist the session. */
  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { username, password })
      .pipe(tap((res) => this.setSession(res)));
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
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, res.username);
    this.tokenSignal.set(res.token);
    this.usernameSignal.set(res.username);
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.tokenSignal.set(null);
    this.usernameSignal.set(null);
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

  /**
   * Decodes the JWT payload and checks `exp`. This is a client-side convenience only —
   * the backend remains the authority and rejects expired tokens regardless.
   */
  private isExpired(token: string): boolean {
    const payload = this.decodePayload(token);
    if (!payload || typeof payload.exp !== 'number') {
      return true;
    }
    return payload.exp * 1000 <= Date.now();
  }

  private decodePayload(token: string): { exp?: number } | null {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(escape(atob(base64))));
    } catch {
      return null;
    }
  }
}
