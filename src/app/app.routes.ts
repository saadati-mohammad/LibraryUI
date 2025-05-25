import { Routes } from '@angular/router';
import { BookComponent } from './features/book/book.component';
import { CatalogComponent } from './features/catalog/catalog.component';
import { LoanComponent } from './features/loan/loan.component';
import { MemberComponent } from './features/member/member.component';
import { ProfileComponent } from './features/profile/profile.component';
import { ReportComponent } from './features/report/report.component';
import { ReservationComponent } from './features/reservation/reservation.component';
import { SystemSettingComponent } from './features/system-setting/system-setting.component';
import { PageNotFoundComponent } from './shared/component/page-not-found/page-not-found.component';
import { AuthComponent } from './features/auth/auth.component';
import { HomeComponent } from './features/home/home.component';

export const routes: Routes = [
    {path: 'home', component: HomeComponent},
    {path: 'auth', component: AuthComponent},
    {path: 'book', component: BookComponent},
    {path: 'catalog', component: CatalogComponent},
    {path: 'loan', component: LoanComponent},
    {path: 'member', component: MemberComponent},
    {path: 'profile', component: ProfileComponent},
    {path: 'report', component: ReportComponent},
    {path: 'reservation', component: ReservationComponent},
    {path: 'systemSetting', component: SystemSettingComponent},
    {path: '',redirectTo: '/home', pathMatch: 'full'},
    {path: '**', component: PageNotFoundComponent},
];
