import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-public-nav',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="public-header">
      <a class="brand" routerLink="/" aria-label="صفحهٔ اصلی کتابخانه">
        <span class="brand-mark" aria-hidden="true">ک</span>
        <span>کتابخانه</span>
      </a>
      <button class="menu-toggle" type="button" [attr.aria-expanded]="menuOpen()"
        aria-controls="public-navigation" (click)="menuOpen.update(value => !value)">
        <span aria-hidden="true">☰</span><span>{{ menuOpen() ? 'بستن منو' : 'باز کردن منو' }}</span>
      </button>
      <nav id="public-navigation" class="public-links" [class.open]="menuOpen()" aria-label="ناوبری عمومی">
        <a routerLink="/" routerLinkActive="current" [routerLinkActiveOptions]="{ exact: true }" (click)="close()">خانه</a>
        <a routerLink="/catalog" routerLinkActive="current" (click)="close()">فهرست کتاب‌ها</a>
        <a routerLink="/categories" routerLinkActive="current" (click)="close()">موضوع‌ها</a>
        <a class="join-link" routerLink="/register" (click)="close()">عضویت</a>
        <a class="login-link" routerLink="/login" (click)="close()">ورود اعضا</a>
      </nav>
    </header>
  `,
  styles: [`
    :host{display:block}.public-header{max-width:1200px;margin:auto;min-height:76px;padding:12px 24px;display:flex;align-items:center;justify-content:space-between;gap:24px}
    .brand{display:inline-flex;align-items:center;gap:10px;text-decoration:none;color:#12372f;font-size:1.25rem;font-weight:800}.brand-mark{display:grid;place-items:center;width:42px;height:42px;border-radius:14px;background:#155e4b;color:#fff;font-size:1.35rem}
    .public-links{display:flex;align-items:center;gap:8px}.public-links a{padding:10px 14px;border-radius:10px;text-decoration:none;color:#37514b;font-weight:600}.public-links a:hover,.public-links a.current{background:#e8f2ed;color:#155e4b}.public-links .login-link{background:#155e4b;color:#fff;margin-inline-start:10px}.menu-toggle{display:none;border:1px solid #cfddd6;border-radius:10px;padding:9px 12px;background:white;color:#173d34;gap:8px;align-items:center}
    @media(max-width:700px){.public-header{min-height:66px;padding:10px 16px;flex-wrap:wrap}.menu-toggle{display:flex}.public-links{display:none;width:100%;align-items:stretch;flex-direction:column;gap:2px;padding:8px 0}.public-links.open{display:flex}.public-links a{padding:12px}.public-links .login-link{margin:4px 0 0;text-align:center}}
    @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicNavComponent {
  readonly menuOpen = signal(false);
  close(): void { this.menuOpen.set(false); }
}
