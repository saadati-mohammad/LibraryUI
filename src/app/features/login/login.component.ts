import { afterNextRender, Component, ElementRef, inject, signal, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/service/auth.service';
import { SESSION_EXPIRED_REASON } from '../../core/service/session-notice.service';

/**
 * Sign-in screen. On success it navigates to the originally requested URL (or /book).
 * Errors are shown inline; credentials are never logged.
 *
 * A session expiry also lands here (the interceptor appends `?reason=session-expired`
 * instead of opening a snackbar), which is why the notice below is part of this page.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './login.component.css',
})
export class LoginComponent {
  username = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  /** True when the user was bounced here because their session expired. */
  readonly sessionExpired = signal(false);
  readonly showPassword = signal(false);

  private readonly usernameInput = viewChild<ElementRef<HTMLInputElement>>('usernameField');

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  constructor() {
    this.sessionExpired.set(
      this.route.snapshot.queryParamMap.get('reason') === SESSION_EXPIRED_REASON,
    );

    // Focus the first field so the operator can start typing immediately (no tab stop
    // needed to reach the form). Guarded by `afterNextRender`, so it only runs in the
    // browser and never during server-side rendering or unit-test instantiation.
    afterNextRender(() => {
      this.usernameInput()?.nativeElement.focus();
    });
  }

  get canSubmit(): boolean {
    return this.username.trim().length > 0 && this.password.length > 0 && !this.loading();
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((visible) => !visible);
  }

  onSubmit(): void {
    if (!this.canSubmit) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.sessionExpired.set(false);

    this.auth.login(this.username.trim(), this.password).subscribe({
      next: () => {
        this.loading.set(false);
        const requested = this.route.snapshot.queryParamMap.get('returnUrl');
        const fallback = this.auth.role()?.toUpperCase() === 'MEMBER' ? '/account' : '/book';
        const returnUrl = requested?.startsWith('/') && !requested.startsWith('//') ? requested : fallback;
        void this.router.navigateByUrl(returnUrl);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        if (err instanceof HttpErrorResponse && err.status === 401) {
          this.error.set('نام کاربری یا رمز عبور نادرست است');
        } else if (err instanceof HttpErrorResponse && err.status === 0) {
          this.error.set('ارتباط با سرور برقرار نشد. اتصال شبکه را بررسی کنید.');
        } else {
          this.error.set('ورود ناموفق بود. لطفاً دوباره تلاش کنید.');
        }
      },
    });
  }
}
