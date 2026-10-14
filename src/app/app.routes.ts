import { Routes } from '@angular/router';
import { authGuard } from './core/guard/auth.guard';
import { staffGuard } from './core/guard/staff.guard';
import { memberGuard } from './core/guard/member.guard';
import { adminGuard } from './core/guard/admin.guard';

/**
 * Public discovery routes expose only the read-only catalog projection. Staff workflows
 * remain protected by {@link authGuard}; unknown URLs are handled by the not-found route.
 *
 * Staff continue to enter at `/book`; members land at `/account`. The public root is the
 * catalog discovery home and unknown paths render a useful not-found page.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/public-home/public-home.component').then(m => m.PublicHomeComponent),
  },
  {
    path: 'catalog',
    loadComponent: () => import('./features/public-catalog/public-catalog.component').then(m => m.PublicCatalogComponent),
  },
  {
    path: 'categories',
    loadComponent: () => import('./features/public-categories/public-categories.component').then(m => m.PublicCategoriesComponent),
  },
  {
    path: 'books/:id',
    loadComponent: () => import('./features/public-book-detail/public-book-detail.component').then(m => m.PublicBookDetailComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/password-recovery/forgot-password.component').then(m => m.ForgotPasswordComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/password-recovery/reset-password.component').then(m => m.ResetPasswordComponent),
  },
  {
    path: 'phone-scan',
    loadComponent: () => import('./features/phone-scanner/phone-scanner.component').then(m => m.PhoneScannerComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'account',
    canActivate: [authGuard, memberGuard],
    loadComponent: () => import('./features/member-account/member-account.component').then(m => m.MemberAccountComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard, staffGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'book',
    canActivate: [authGuard, staffGuard],
    loadComponent: () => import('./features/book/book.component').then(m => m.BookComponent),
  },
  {
    path: 'person',
    canActivate: [authGuard, staffGuard],
    loadComponent: () => import('./features/person/person.component').then(m => m.PersonComponent),
  },
  {
    path: 'staff-accounts',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/staff-accounts/staff-accounts.component').then(m => m.StaffAccountsComponent),
  },
  {
    path: 'input-devices',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/input-devices/input-devices.component').then(m => m.InputDevicesComponent),
  },
  {
    path: 'loan',
    canActivate: [authGuard, staffGuard],
    loadComponent: () => import('./features/loan/loan.component').then(m => m.LoanComponent),
  },
  {
    path: 'reservation',
    canActivate: [authGuard, staffGuard],
    loadComponent: () =>
      import('./features/reservation/reservation.component').then(m => m.ReservationComponent),
  },
  {
    path: '**',
    loadComponent: () => import('./shared/component/page-not-found/page-not-found.component').then(m => m.PageNotFoundComponent),
  },
];
