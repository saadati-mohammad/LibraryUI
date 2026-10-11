import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/service/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="recovery-page" dir="rtl" lang="fa">
      <section class="recovery-card" aria-labelledby="title">
        <a routerLink="/login" class="back-link">بازگشت به ورود</a>
        <p class="eyebrow">امنیت حساب</p><h1 id="title">تعیین رمز عبور جدید</h1>
        @if (complete()) {
          <p class="success" role="status">رمز عبور تغییر کرد. اکنون با رمز جدید وارد شوید.</p>
          <a class="login-link" routerLink="/login">رفتن به صفحه ورود</a>
        } @else if (!token) {
          <p class="error" role="alert">پیوند بازیابی معتبر نیست. دوباره درخواست لینک کنید.</p>
          <a class="login-link" routerLink="/forgot-password">درخواست لینک جدید</a>
        } @else {
          <p class="intro">رمز جدید باید دست‌کم ۱۲ نویسه داشته باشد.</p>
          <form (ngSubmit)="submit()" #form="ngForm">
            <label for="newPassword">رمز عبور جدید</label>
            <input id="newPassword" name="password" type="password" [(ngModel)]="password" required minlength="12" maxlength="128" autocomplete="new-password">
            <label for="confirmPassword">تکرار رمز عبور</label>
            <input id="confirmPassword" name="confirmPassword" type="password" [(ngModel)]="confirmPassword" required minlength="12" maxlength="128" autocomplete="new-password">
            @if (password && confirmPassword && password !== confirmPassword) { <p class="error" role="alert">دو رمز واردشده یکسان نیستند.</p> }
            @if (error()) { <p class="error" role="alert">{{error()}}</p> }
            <button [disabled]="form.invalid || password !== confirmPassword || loading()">{{loading() ? 'در حال ثبت…' : 'ثبت رمز جدید'}}</button>
          </form>
        }
      </section>
    </main>
  `,
  styles: [`
    :host{display:block}.recovery-page{min-height:70vh;display:grid;place-items:center;padding:24px;background:#f2f6f3;color:#183328}
    .recovery-card{width:min(100%,470px);padding:clamp(22px,5vw,40px);border:1px solid #d8e4dc;border-radius:18px;background:#fff;box-shadow:0 16px 50px #153d2514}
    .back-link,.login-link{color:#246844;font-weight:650;text-decoration:none}.eyebrow{margin:28px 0 5px;color:#397856;font-weight:700}.recovery-card h1{margin:0;font-size:clamp(1.5rem,4vw,2rem)}.intro{line-height:1.9;color:#52675b}
    form{display:grid;gap:10px;margin-top:24px}label{font-weight:700}input{min-height:48px;padding:10px 13px;border:1px solid #9fb4a6;border-radius:9px;background:#fff;color:#183328;font:inherit}input:focus-visible,button:focus-visible{outline:3px solid #238453;outline-offset:2px}
    button{min-height:48px;margin-top:8px;border:0;border-radius:9px;background:#176b43;color:#fff;font:inherit;font-weight:700;cursor:pointer}button:disabled{opacity:.55;cursor:wait}.success,.error{padding:14px;border-radius:10px;line-height:1.8}.success{margin-top:22px;background:#eaf5ed;color:#245d40}.error{background:#fff0ef;color:#8d2f28}.login-link{display:inline-block;margin-top:14px}
  `],
})
export class ResetPasswordComponent {
  private readonly auth = inject(AuthService);
  token = inject(ActivatedRoute).snapshot.queryParamMap.get('token') ?? '';
  password = '';
  confirmPassword = '';
  readonly loading = signal(false);
  readonly complete = signal(false);
  readonly error = signal<string | null>(null);

  submit(): void {
    if (this.loading() || this.password !== this.confirmPassword || this.password.length < 12) return;
    this.loading.set(true); this.error.set(null);
    this.auth.resetPassword(this.token, this.password).subscribe({
      next: () => { this.loading.set(false); this.complete.set(true); this.password = ''; this.confirmPassword = ''; },
      error: () => { this.loading.set(false); this.error.set('پیوند نامعتبر یا منقضی شده است. برای دریافت لینک تازه دوباره درخواست کنید.'); },
    });
  }
}
