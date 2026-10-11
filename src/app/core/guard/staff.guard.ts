import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

/** Client-side role gate for staff screens; server-side authorization remains authoritative. */
export const staffGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  const role = auth.role()?.toUpperCase();
  if (role === 'ADMIN' || role === 'LIBRARIAN') return true;
  return router.createUrlTree(['/account']);
};
