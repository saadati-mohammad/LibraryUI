import { ChangeDetectionStrategy, Component, ElementRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { NgForm } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/service/auth.service';
import { PublicNavComponent } from '../../shared/component/public-nav/public-nav.component';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, PublicNavComponent],
  template: `
    <app-public-nav />
    <main class="register-page">
      <section class="register-card" aria-labelledby="register-title">
        <p class="eyebrow">عضویت در کتابخانه</p>
        <h1 id="register-title">ساخت حساب کاربری</h1>
        <p class="intro">با حساب خود می‌توانید رزروها و وضعیت امانت را پیگیری کنید.</p>
        <form (ngSubmit)="submit(registerForm)" #registerForm="ngForm" novalidate>
          @if (submitted() && (registerForm.invalid || passwordMismatch)) {
            <p class="error-summary" role="alert">لطفاً موارد مشخص‌شده را بررسی کنید.</p>
          }
          <div class="name-grid">
            <label>نام<input name="firstName" [(ngModel)]="firstName" #firstNameField="ngModel" autocomplete="given-name" required maxlength="100" [attr.aria-invalid]="showError(firstNameField)" aria-describedby="firstNameError">
              @if (showError(firstNameField)) { <small class="field-error" id="firstNameError">نام را وارد کنید.</small> }
            </label>
            <label>نام خانوادگی<input name="lastName" [(ngModel)]="lastName" #lastNameField="ngModel" autocomplete="family-name" required maxlength="100" [attr.aria-invalid]="showError(lastNameField)" aria-describedby="lastNameError">
              @if (showError(lastNameField)) { <small class="field-error" id="lastNameError">نام خانوادگی را وارد کنید.</small> }
            </label>
          </div>
          <label>ایمیل<input name="email" [(ngModel)]="email" #emailField="ngModel" type="email" autocomplete="email" required maxlength="254" autocapitalize="none" [attr.aria-invalid]="showError(emailField)" aria-describedby="emailError">
            @if (showError(emailField)) { <small class="field-error" id="emailError">{{ emailField.errors?.['required'] ? 'ایمیل را وارد کنید.' : 'یک نشانی ایمیل معتبر وارد کنید.' }}</small> }
          </label>
          <label>کد ملی<input name="nationalId" [(ngModel)]="nationalId" #nationalIdField="ngModel" type="text" inputmode="numeric" autocomplete="off" required minlength="10" maxlength="10" pattern="[0-9]{10}" dir="ltr" [attr.aria-invalid]="showError(nationalIdField)" aria-describedby="nationalIdHelp nationalIdError">
            <small id="nationalIdHelp">برای اتصال حساب به پروندهٔ عضویت کتابخانه</small>
            @if (showError(nationalIdField)) { <small class="field-error" id="nationalIdError">کد ملی باید دقیقاً ۱۰ رقم انگلیسی باشد.</small> }
          </label>
          <label>شمارهٔ همراه <span class="optional">اختیاری</span><input name="phone" [(ngModel)]="phone" type="tel" autocomplete="tel" maxlength="30" dir="ltr"></label>
          <label>گذرواژه
            <span class="password-control"><input name="password" [(ngModel)]="password" #passwordField="ngModel" [type]="showPassword() ? 'text' : 'password'" autocomplete="new-password" required minlength="12" maxlength="128" [attr.aria-invalid]="showError(passwordField)" aria-describedby="passwordHelp passwordError"><button class="reveal" type="button" (click)="showPassword.update(value => !value)" [attr.aria-pressed]="showPassword()" [attr.aria-label]="showPassword() ? 'پنهان‌کردن گذرواژه' : 'نمایش گذرواژه'">{{ showPassword() ? 'پنهان' : 'نمایش' }}</button></span>
            <small id="passwordHelp">حداقل ۱۲ نویسه</small>
            @if (showError(passwordField)) { <small class="field-error" id="passwordError">گذرواژه باید دست‌کم ۱۲ نویسه داشته باشد.</small> }
            <small class="requirement" [class.met]="password.length >= 12">{{ password.length >= 12 ? '✓' : '○' }} حداقل ۱۲ نویسه</small>
          </label>
          <label>تکرار گذرواژه
            <span class="password-control"><input name="confirmPassword" [(ngModel)]="confirmPassword" #confirmField="ngModel" [type]="showConfirmPassword() ? 'text' : 'password'" autocomplete="new-password" required minlength="12" maxlength="128" [attr.aria-invalid]="showError(confirmField) || passwordMismatch" aria-describedby="confirmError"><button class="reveal" type="button" (click)="showConfirmPassword.update(value => !value)" [attr.aria-pressed]="showConfirmPassword()" [attr.aria-label]="showConfirmPassword() ? 'پنهان‌کردن تکرار گذرواژه' : 'نمایش تکرار گذرواژه'">{{ showConfirmPassword() ? 'پنهان' : 'نمایش' }}</button></span>
            @if (showError(confirmField) || passwordMismatch) { <small class="field-error" id="confirmError">{{ passwordMismatch ? 'تکرار گذرواژه با گذرواژه یکسان نیست.' : 'تکرار گذرواژه را وارد کنید.' }}</small> }
            <small class="requirement" [class.met]="password.length > 0 && password === confirmPassword">{{ password.length > 0 && password === confirmPassword ? '✓' : '○' }} گذرواژه‌ها یکسان باشند</small>
          </label>
          @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
          <button type="submit" [disabled]="loading()" [attr.aria-busy]="loading()">{{ loading() ? 'در حال ایجاد حساب…' : 'ایجاد حساب' }}</button>
        </form>
        <p class="sign-in">حساب دارید؟ <a routerLink="/login">وارد شوید</a></p>
      </section>
    </main>
  `,
  styles: [`
    :host{display:block;min-height:100vh;background:#f5f7f2;color:#183c33}.register-page{padding:38px 16px 70px}.register-card{width:min(560px,100%);margin:auto;padding:clamp(22px,5vw,42px);background:#fff;border:1px solid #e1e9e3;border-radius:22px;box-shadow:0 12px 38px #173d340b}.eyebrow{margin:0;color:#34745f;font-weight:700}.register-card h1{font-size:clamp(1.8rem,5vw,2.5rem);margin:5px 0}.intro{color:#60766e;line-height:1.8;margin:5px 0 24px}.register-card form{display:grid;gap:14px}.register-card label{display:grid;gap:6px;font-weight:650}.register-card input{height:48px;width:100%;border:1px solid #cfdcd4;border-radius:10px;padding:0 12px;font:inherit;color:#183c33;background:white}.register-card input:focus-visible,.register-card button:focus-visible{outline:3px solid #75ad91;outline-offset:2px}.register-card input[aria-invalid=true]{border-color:#b5443e}.register-card small{color:#718078;font-weight:400}.register-card .field-error,.error-summary,.error{color:#8e2f2b}.name-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.optional{font-weight:400;color:#718078;font-size:.85rem}.password-control{display:flex;align-items:center;gap:8px}.password-control input{flex:1;min-width:0}.reveal{height:40px;padding:0 10px;border:1px solid #cfdcd4;border-radius:8px;background:#f5f7f2;color:#155e4b;font:inherit;cursor:pointer}.requirement{font-size:.85rem}.requirement.met{color:#176a48}.register-card form>button{min-height:49px;border:0;border-radius:11px;background:#155e4b;color:#fff;font:inherit;font-weight:700;cursor:pointer}.register-card form>button:disabled{opacity:.7;cursor:wait}.error-summary,.error{margin:0;padding:11px;border-radius:9px;background:#fff0ef}.sign-in{text-align:center;margin:20px 0 0;color:#60766e}.sign-in a{color:#155e4b;font-weight:700}@media(max-width:480px){.register-page{padding-top:22px}.name-grid{grid-template-columns:1fr}}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);

  firstName = ''; lastName = ''; email = ''; nationalId = ''; phone = ''; password = ''; confirmPassword = '';
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly submitted = signal(false);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  get passwordMismatch(): boolean { return this.confirmPassword.length > 0 && this.password !== this.confirmPassword; }

  showError(control: { invalid: boolean; touched: boolean } | null | undefined): boolean {
    return !!control?.invalid && (control.touched || this.submitted());
  }

  submit(form: NgForm): void {
    if (this.loading()) return;
    this.submitted.set(true);
    form.control.markAllAsTouched();
    if (form.invalid || this.passwordMismatch) {
      this.error.set(null);
      queueMicrotask(() => this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const credentials = { firstName: this.firstName.trim(), lastName: this.lastName.trim(), email: this.email.trim().toLowerCase(), nationalId: this.nationalId.trim(), phone: this.phone.trim() || null, password: this.password };
    this.auth.register(credentials).subscribe({
      next: () => this.auth.login(credentials.email, credentials.password).subscribe({
        next: () => { this.loading.set(false); void this.router.navigateByUrl('/account'); },
        error: () => { this.loading.set(false); this.error.set('حساب ساخته شد، اما ورود خودکار انجام نشد. از صفحهٔ ورود وارد شوید.'); },
      }),
      error: (failure: unknown) => {
        this.loading.set(false);
        if (failure instanceof HttpErrorResponse && failure.status === 409) this.error.set('حسابی با این ایمیل یا کد ملی وجود دارد.');
        else if (failure instanceof HttpErrorResponse && failure.status === 0) this.error.set('ارتباط با سرور برقرار نشد. اتصال شبکه را بررسی کنید.');
        else this.error.set('ایجاد حساب ممکن نشد. اطلاعات را بررسی و دوباره تلاش کنید.');
      },
    });
  }
}
