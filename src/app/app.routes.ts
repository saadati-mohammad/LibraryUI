import { Routes } from '@angular/router';
import { PageNotFoundComponent } from './shared/component/page-not-found/page-not-found.component';
import { BaseLayoutComponent } from './layout/base-layout/base-layout.component';

export const routes: Routes = [
    { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
    {
        path: '', component: BaseLayoutComponent,
        children: [
            { path: 'catalog', loadComponent: () => import('./features/catalog/catalog.component').then(m => m.CatalogComponent) },
            { path: 'auth', loadComponent: () => import('./features/auth/auth.component').then(m => m.AuthComponent) },
            { path: 'book', loadComponent: () => import('./features/book/book.component').then(m => m.BookComponent) },
            { path: 'loan', loadComponent: () => import('./features/loan/loan.component').then(m => m.LoanComponent) },
            { path: 'member', loadComponent: () => import('./features/member/member.component').then(m => m.MemberComponent) },
            { path: 'profile', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) },
            { path: 'reservation', loadComponent: () => import('./features/reservation/reservation.component').then(m => m.ReservationComponent) },
            { path: 'report', loadComponent: () => import('./features/report/report.component').then(m => m.ReportComponent) },
            { path: 'systemSetting', loadComponent: () => import('./features/system-setting/system-setting.component').then(m => m.SystemSettingComponent) },
        ]
    },
    { path: '**', component: PageNotFoundComponent },
    // {path: '',redirectTo: '/home', pathMatch: 'full'},
];
