import { Component, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDivider } from '@angular/material/divider';
import { NgForOf } from '@angular/common';
import { AuthService } from '../../../core/service/auth.service';

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
    MatDivider,
    NgForOf,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Signed-in operator name, shown in the toolbar. */
  readonly userName = this.auth.username;

  navLinks: NavLink[] = [
    { path: '/book', label: 'کتاب‌ها', icon: 'menu_book' },
    { path: '/person', label: 'اعضا', icon: 'groups' },
    { path: '/loan', label: 'امانت‌ها', icon: 'assignment_return' },
  ];

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
