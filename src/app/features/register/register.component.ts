import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/service/auth.service';
import { PublicNavComponent } from '../../shared/component/public-nav/public-nav.component';

@Component({selector:'app-register',imports:[FormsModule,RouterLink,PublicNavComponent],template:`
  <app-public-nav/><main class="register-page"><section class="register-card" aria-labelledby="register-title"><p class="eyebrow">عضویت در کتابخانه</p><h1 id="register-title">ساخت حساب کاربری</h1><p class="intro">با حساب خود می‌توانید رزروها و وضعیت امانت را پیگیری کنید.</p>
    <form (ngSubmit)="submit()" #registerForm="ngForm" novalidate>
      <div class="name-grid"><label>نام<input name="firstName" [(ngModel)]="firstName" autocomplete="given-name" required maxlength="100"></label><label>نام خانوادگی<input name="lastName" [(ngModel)]="lastName" autocomplete="family-name" required maxlength="100"></label></div>
      <label>ایمیل<input name="email" [(ngModel)]="email" type="email" autocomplete="email" required maxlength="254" autocapitalize="none"></label>
      <label>کد ملی<input name="nationalId" [(ngModel)]="nationalId" type="text" inputmode="numeric" autocomplete="off" required minlength="10" maxlength="10" pattern="[0-9]{10}" dir="ltr"><small>برای اتصال حساب به پروندهٔ عضویت کتابخانه</small></label>
      <label>شمارهٔ همراه <span class="optional">اختیاری</span><input name="phone" [(ngModel)]="phone" type="tel" autocomplete="tel" maxlength="30" dir="ltr"></label>
      <label>گذرواژه<input name="password" [(ngModel)]="password" type="password" autocomplete="new-password" required minlength="12" maxlength="128"><small>حداقل ۱۲ نویسه</small></label>
      <label>تکرار گذرواژه<input name="confirmPassword" [(ngModel)]="confirmPassword" type="password" autocomplete="new-password" required minlength="12" maxlength="128"></label>
      @if(error()){<p class="error" role="alert">{{error()}}</p>}
      <button type="submit" [disabled]="!registerForm.valid || password!==confirmPassword || loading()" [attr.aria-busy]="loading()">{{loading()?'در حال ایجاد حساب…':'ایجاد حساب'}}</button>
    </form><p class="sign-in">حساب دارید؟ <a routerLink="/login">وارد شوید</a></p>
  </section></main>
`,styles:[`:host{display:block;min-height:100vh;background:#f5f7f2;color:#183c33}.register-page{padding:38px 16px 70px}.register-card{width:min(560px,100%);margin:auto;padding:clamp(22px,5vw,42px);background:#fff;border:1px solid #e1e9e3;border-radius:22px;box-shadow:0 12px 38px #173d340b}.eyebrow{margin:0;color:#34745f;font-weight:700}.register-card h1{font-size:clamp(1.8rem,5vw,2.5rem);margin:5px 0}.intro{color:#60766e;line-height:1.8;margin:5px 0 24px}.register-card form{display:grid;gap:14px}.register-card label{display:grid;gap:6px;font-weight:650}.register-card input{height:48px;width:100%;border:1px solid #cfdcd4;border-radius:10px;padding:0 12px;font:inherit;color:#183c33;background:white}.register-card input:focus-visible{outline:3px solid #75ad91;outline-offset:2px}.register-card small{color:#718078;font-weight:400}.name-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.optional{font-weight:400;color:#718078;font-size:.85rem}.register-card button{min-height:49px;border:0;border-radius:11px;background:#155e4b;color:#fff;font:inherit;font-weight:700;cursor:pointer}.register-card button:disabled{background:#9aaea3;cursor:not-allowed}.error{margin:0;padding:11px;border-radius:9px;background:#fff0ef;color:#8e2f2b}.sign-in{text-align:center;margin:20px 0 0;color:#60766e}.sign-in a{color:#155e4b;font-weight:700}@media(max-width:480px){.register-page{padding-top:22px}.name-grid{grid-template-columns:1fr}}`],changeDetection:ChangeDetectionStrategy.OnPush})
export class RegisterComponent {
  private readonly auth=inject(AuthService);private readonly router=inject(Router);
  firstName='';lastName='';email='';nationalId='';phone='';password='';confirmPassword='';
  readonly loading=signal(false);readonly error=signal<string|null>(null);
  submit():void{if(this.loading())return;if(this.password!==this.confirmPassword){this.error.set('تکرار گذرواژه با گذرواژه یکسان نیست.');return;}this.loading.set(true);this.error.set(null);const credentials={firstName:this.firstName.trim(),lastName:this.lastName.trim(),email:this.email.trim().toLowerCase(),nationalId:this.nationalId.trim(),phone:this.phone.trim()||null,password:this.password};this.auth.register(credentials).subscribe({next:()=>this.auth.login(credentials.email,credentials.password).subscribe({next:()=>{this.loading.set(false);void this.router.navigateByUrl('/account');},error:()=>{this.loading.set(false);this.error.set('حساب ساخته شد، اما ورود خودکار انجام نشد. از صفحهٔ ورود وارد شوید.');}}),error:(error:unknown)=>{this.loading.set(false);if(error instanceof HttpErrorResponse&&error.status===409)this.error.set('حسابی با این ایمیل یا کد ملی وجود دارد.');else if(error instanceof HttpErrorResponse&&error.status===0)this.error.set('ارتباط با سرور برقرار نشد. اتصال شبکه را بررسی کنید.');else this.error.set('ایجاد حساب ممکن نشد. اطلاعات را بررسی و دوباره تلاش کنید.');}});}
}
