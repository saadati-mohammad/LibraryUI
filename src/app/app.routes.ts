import { Routes } from '@angular/router';
import { authGuard } from './core/guard/auth.guard';

/**
 * Every business route is protected by {@link authGuard}. The login route is public;
 * an unknown path redirects to /book, which the guard will bounce to /login when the
 * user is not authenticated.
 */
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'book',
    canActivate: [authGuard],
    loadComponent: () => import('./features/book/book.component').then(m => m.BookComponent),
  },
  {
    path: 'person',
    canActivate: [authGuard],
    loadComponent: () => import('./features/person/person.component').then(m => m.PersonComponent),
  },
  {
    path: 'loan',
    canActivate: [authGuard],
    loadComponent: () => import('./features/loan/loan.component').then(m => m.LoanComponent),
  },
  { path: '**', redirectTo: '/book', pathMatch: 'full' },
];
