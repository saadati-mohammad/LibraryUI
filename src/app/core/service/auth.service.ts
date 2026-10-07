import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Minimal authentication state holder.
 *
 * The previous implementation exposed a `logout()` that unconditionally threw
 * "Method not implemented", which would crash any caller. Authentication is not yet
 * wired to the backend, so this service now stores the current user in memory and
 * performs a safe, side-effect-free logout instead of throwing.
 *
 * When a real auth backend is added, replace `setCurrentUser`/`logout` with calls to
 * the auth endpoints and persist the token in an appropriate store.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly currentUserSubject = new BehaviorSubject<unknown | null>(null);
  readonly currentUser$: Observable<unknown | null> = this.currentUserSubject.asObservable();

  get currentUser(): unknown | null {
    return this.currentUserSubject.value;
  }

  setCurrentUser(user: unknown | null): void {
    this.currentUserSubject.next(user);
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  logout(): void {
    // Clear in-memory identity. Real token/session cleanup belongs here once
    // authentication is backed by the server.
    this.currentUserSubject.next(null);
  }
}
