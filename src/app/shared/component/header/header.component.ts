import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/service/auth.service';
import { ThemeService } from '../../../core/service/theme.service';

interface NavLink {
  path: string;
  label: string;
  icon: string;
}

/** Persona/role label for the signed-in operator. */
const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'مدیر سیستم',
  LIBRARIAN: 'کتابدار',
  USER: 'کاربر',
};

@Component({
  selector: 'app-header',
  imports: [
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  private readonly auth = inject(AuthService);
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  /** Signed-in operator name, shown in the toolbar. */
  readonly userName = this.auth.username;
  readonly userRole = this.auth.role;
  readonly roleLabel = computed(() => {
    const role = this.userRole();
    return role ? (ROLE_LABELS[role.toUpperCase()] ?? role) : 'کاربر';
  });

  readonly theme = toSignal(this.themeService.currentTheme$, {
    initialValue: this.themeService.currentTheme,
  });
  readonly isDark = computed(() => this.theme() === 'dark');
  readonly themeToggleLabel = computed(() =>
    this.isDark() ? 'تغییر به پوسته روشن' : 'تغییر به پوسته تیره',
  );

  private readonly staffNavLinks: NavLink[] = [
    { path: '/dashboard', label: 'داشبورد', icon: 'dashboard' },
    { path: '/book', label: 'کتاب‌ها', icon: 'menu_book' },
    { path: '/person', label: 'اعضا', icon: 'groups' },
    { path: '/loan', label: 'امانت‌ها', icon: 'assignment_return' },
    { path: '/reservation', label: 'رزروها', icon: 'event_available' },
  ];

  get navLinks(): NavLink[] {
    return this.auth.role()?.toUpperCase() === 'ADMIN'
      ? [...this.staffNavLinks, { path: '/staff-accounts', label: 'حساب‌های کارکنان', icon: 'manage_accounts' }]
      : this.staffNavLinks;
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
