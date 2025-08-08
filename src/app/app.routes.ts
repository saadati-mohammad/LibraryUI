import { Routes } from '@angular/router';
export const routes: Routes = [
            { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)},
            { path: 'book', loadComponent: () => import('./features/book/book.component').then(m => m.BookComponent)},
            { path: 'person', loadComponent: () => import('./features/person/person.component').then(m => m.PersonComponent)},
            { path: 'loan', loadComponent: () => import('./features/loan/loan.component').then(m => m.LoanComponent)},
            { path: 'profile', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)},
            { path: 'reservation', loadComponent: () => import('./features/reservation/reservation.component').then(m => m.ReservationComponent)},
            { path: 'chat', loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent)},
            { path: 'report', loadComponent: () => import('./features/report/report.component').then(m => m.ReportComponent)},
            { path: 'systemSetting', loadComponent: () => import('./features/system-setting/system-setting.component').then(m => m.SystemSettingComponent)},
            { path: 'auth', loadComponent: () => import('./features/auth/auth.component').then(m => m.AuthComponent)},
    { path: '**',redirectTo: '/dashboard', pathMatch: 'full'},
];
