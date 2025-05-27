import { Routes } from '@angular/router';
import { PageNotFoundComponent } from './shared/component/page-not-found/page-not-found.component';
import { BaseLayoutComponent } from './layout/base-layout/base-layout.component';

export const routes: Routes = [
    // { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
    // {
        // path: '', component: BaseLayoutComponent,
        // children: [
            // { path: '', loadComponent: () => import('./layout/base-layout/base-layout.component').then(m => m.BaseLayoutComponent) },
            { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
            { path: 'auth', loadComponent: () => import('./features/auth/auth.component').then(m => m.AuthComponent) },
            { path: 'book', loadComponent: () => import('./features/book/book.component').then(m => m.BookComponent) },
            { path: 'loan', loadComponent: () => import('./features/loan/loan.component').then(m => m.LoanComponent) },
            { path: 'member', loadComponent: () => import('./features/member/member.component').then(m => m.MemberComponent) },
            { path: 'profile', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) },
            { path: 'reservation', loadComponent: () => import('./features/reservation/reservation.component').then(m => m.ReservationComponent) },
            { path: 'report', loadComponent: () => import('./features/report/report.component').then(m => m.ReportComponent) },
            { path: 'systemSetting', loadComponent: () => import('./features/system-setting/system-setting.component').then(m => m.SystemSettingComponent) },
        // ]
    // },
    { path: '**', component: PageNotFoundComponent },
    {path: '',redirectTo: '/dashboard', pathMatch: 'full'},
];
