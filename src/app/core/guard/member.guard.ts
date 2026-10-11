import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

/** Prevents staff sessions from entering member-only self-service routes. */
export const memberGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  return auth.role()?.toUpperCase() === 'MEMBER' ? true : router.createUrlTree(['/dashboard']);
};
