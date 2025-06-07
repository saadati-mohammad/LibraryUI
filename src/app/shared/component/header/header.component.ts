import {Component} from '@angular/core';
import {RouterModule} from '@angular/router';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {MatDivider} from '@angular/material/divider';
import {NgForOf} from '@angular/common';

interface NavLink {
  path: string;
  label: string;
  icon: string;
}
@Component({
  selector: 'app-header',
  imports: [
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    NgForOf
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  navLinks: NavLink[] = [
    // { path: '/dashboard', label: 'داشبورد', icon: 'dashboard' },
    { path: '/book', label: 'کتاب‌ها', icon: 'menu_book' },
    { path: '/person', label: 'اعضا', icon: 'groups' },
    { path: '/loan', label: 'امانت‌ها', icon: 'assignment_return' },
    // { path: '/reservation', label: 'رزروها', icon: 'event_note' },
    // { path: '/report', label: 'گزارش‌ها', icon: 'bar_chart' },
    // { path: '/systemSetting', label: 'تنظیمات', icon: 'settings' }
  ];

  // در صورت نیاز به اطلاعات کاربر یا لوگو در آینده
  userName: string = 'نام کاربر'; // مثال
  userRole: string = 'نقش کاربر'; // مثال
  logoUrl: string = 'assets/logo.png'; // مسیر لوگوی خود را قرار دهید

  constructor() { }

  logout() {

  }
}
