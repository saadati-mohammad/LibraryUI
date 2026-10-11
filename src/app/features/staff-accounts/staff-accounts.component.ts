import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/service/auth.service';
import { StaffAccountService } from '../../core/service/staff-account.service';
import { StaffAccount, StaffRole } from '../../core/model/staff-account.model';

@Component({
  selector: 'app-staff-accounts',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="staff-page" dir="rtl" lang="fa">
      <header class="page-heading"><div><p class="eyebrow">تنظیمات دسترسی</p><h1>حساب‌های کارکنان</h1>
        <p>حساب بسازید، نقش دسترسی را تغییر دهید یا دسترسی را موقتاً غیرفعال کنید.</p></div></header>
      @if (notice()) { <p class="notice" role="status">{{notice()}}</p> }
      @if (error()) { <p class="error" role="alert">{{error()}}</p> }
      <section class="panel" aria-labelledby="formTitle">
        <h2 id="formTitle">{{editing() ? 'ویرایش حساب' : 'ساخت حساب کارکنان'}}</h2>
        <form (ngSubmit)="save()" #form="ngForm" class="account-form">
          @if (!editing()) {
            <label>نام کاربری<input name="username" [(ngModel)]="draft.username" required minlength="3" maxlength="80"
              pattern="[A-Za-z0-9][A-Za-z0-9._@+-]{2,79}" autocomplete="username"></label>
          } @else { <p class="username">نام کاربری: <b dir="ltr">{{editing()!.username}}</b></p> }
          <label>نام نمایشی<input name="displayName" [(ngModel)]="draft.displayName" required maxlength="160" autocomplete="name"></label>
          <label>ایمیل بازیابی<input name="email" [(ngModel)]="draft.email" type="email" required email maxlength="254" autocomplete="email" dir="ltr"></label>
          <label>نقش دسترسی<select name="role" [(ngModel)]="draft.role" required>
            <option value="LIBRARIAN">کتابدار</option><option value="ADMIN">مدیر سیستم</option>
          </select></label>
          <label>رمز عبور<input name="password" [(ngModel)]="draft.password" type="password"
            [required]="!editing()" [minlength]="editing() && !draft.password ? null : 12" maxlength="128" autocomplete="new-password"
            [placeholder]="editing() ? 'برای حفظ رمز فعلی خالی بگذارید' : 'حداقل ۱۲ نویسه'"></label>
          <div class="form-actions"><button class="primary" [disabled]="saving() || form.invalid">{{saving() ? 'در حال ذخیره…' : editing() ? 'ذخیره تغییرات' : 'ایجاد حساب'}}</button>
            @if (editing()) { <button type="button" class="secondary" (click)="cancelEdit()">انصراف</button> }</div>
        </form>
        <p class="help">رمز عبور حداقل ۱۲ نویسه است و به‌صورت هش‌شده ذخیره می‌شود. حساب غیرفعال حذف نمی‌شود و سوابقش باقی می‌ماند.</p>
      </section>
      <section class="panel" aria-labelledby="listTitle"><div class="section-heading"><h2 id="listTitle">فهرست حساب‌ها</h2>
        <button type="button" class="secondary" (click)="load()" [disabled]="loading()">به‌روزرسانی</button></div>
        @if (loading()) { <p role="status">در حال دریافت حساب‌ها…</p> }
        @else if (!accounts().length) { <p class="empty">هنوز حساب کارمندی ساخته نشده است.</p> }
        <div class="account-list">
          @for (account of accounts(); track account.id) {
            <article class="account-row" [class.inactive]="!account.active">
              <div class="identity"><h3>{{account.displayName}}</h3><p dir="ltr">{{account.username}}</p><p dir="ltr">{{account.email || 'ایمیل بازیابی ثبت نشده'}}</p></div>
              <span class="role">{{account.role === 'ADMIN' ? 'مدیر سیستم' : 'کتابدار'}}</span>
              <span class="state" [class.off]="!account.active">{{account.active ? 'فعال' : 'غیرفعال'}}</span>
              <div class="row-actions"><button type="button" class="secondary" (click)="edit(account)">ویرایش</button>
                @if (account.username.toLowerCase() !== (currentUsername() ?? '').toLowerCase()) {
                  @if (account.active) { <button type="button" class="danger" (click)="deactivate(account)">غیرفعال‌سازی</button> }
                  @else { <button type="button" class="secondary" (click)="reactivate(account)">فعال‌سازی</button> }
                }
              </div>
            </article>
          }
        </div>
      </section>
    </main>
  `,
  styles: [`
    :host{display:block}.staff-page{max-width:1120px;margin:0 auto;padding:clamp(18px,3vw,40px);color:#182c23}
    .page-heading{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}.page-heading h1{margin:0;font-size:clamp(1.45rem,2.2vw,2rem)}
    .page-heading p{margin:8px 0 0;color:#52665b}.eyebrow{color:#397856!important;font-weight:700;font-size:.85rem}
    .panel{background:#fff;border:1px solid #dce6df;border-radius:16px;padding:clamp(16px,2.5vw,26px);margin:18px 0;box-shadow:0 8px 28px #163d2510}
    h2{font-size:1.15rem;margin:0 0 18px}.account-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
    label{display:grid;gap:7px;font-weight:650;font-size:.92rem}input,select{width:100%;min-height:44px;padding:9px 12px;border:1px solid #aabbb0;border-radius:9px;background:#fff;color:#172c22;font:inherit}
    input:focus-visible,select:focus-visible,button:focus-visible{outline:3px solid #238453;outline-offset:2px}.form-actions{display:flex;gap:10px;align-items:center}
    button{min-height:40px;border:0;border-radius:9px;padding:9px 15px;font:inherit;font-weight:700;cursor:pointer}.primary{background:#176b43;color:white}.secondary{background:#edf4ef;color:#244b35}.danger{background:#fff0ee;color:#922f27}
    button:disabled{opacity:.6;cursor:wait}.help,.empty{color:#5c6e63;font-size:.9rem;margin:14px 0 0}.username{align-self:center;color:#52665b}
    .section-heading{display:flex;justify-content:space-between;align-items:center}.section-heading h2{margin-bottom:0}.account-list{display:grid;gap:10px;margin-top:18px}
    .account-row{display:grid;grid-template-columns:minmax(160px,1fr) auto auto auto;gap:16px;align-items:center;padding:14px;border:1px solid #e0e9e3;border-radius:12px}
    .account-row.inactive{background:#f7f8f7;color:#637168}.identity h3{margin:0;font-size:1rem}.identity p{margin:5px 0 0;color:#64766b;text-align:left;font-size:.9rem}.role,.state{white-space:nowrap}.state{padding:5px 10px;border-radius:99px;background:#e4f3e9;color:#246440;font-size:.85rem}.state.off{background:#f0f0ee;color:#5b625e}.row-actions{display:flex;gap:8px}.notice,.error{padding:12px 15px;border-radius:10px}.notice{background:#e6f3e9;color:#245d40}.error{background:#fff0ef;color:#8d2f28}
    @media(max-width:720px){.account-form{grid-template-columns:1fr}.account-row{grid-template-columns:1fr auto;gap:10px}.identity{grid-column:1}.role{grid-column:1}.state{grid-column:2;grid-row:1}.row-actions{grid-column:1/-1;flex-wrap:wrap}.row-actions button{flex:1}}
  `],
})
export class StaffAccountsComponent implements OnInit {
  private readonly service = inject(StaffAccountService);
  private readonly auth = inject(AuthService);
  readonly accounts = signal<StaffAccount[]>([]);
  readonly editing = signal<StaffAccount | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly currentUsername = this.auth.username;
  draft = this.emptyDraft();

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true); this.error.set(null);
    this.service.list().subscribe({
      next: accounts => { this.accounts.set(accounts); this.loading.set(false); },
      error: () => { this.error.set('دریافت حساب‌های کارکنان ممکن نشد.'); this.loading.set(false); },
    });
  }

  save(): void {
    if (this.saving()) return;
    this.saving.set(true); this.error.set(null); this.notice.set(null);
    const selected = this.editing();
    const request = selected
      ? this.service.update(selected.id, { displayName: this.draft.displayName.trim(), email: this.draft.email.trim(), role: this.draft.role, password: this.draft.password || null })
      : this.service.create({ username: this.draft.username.trim(), displayName: this.draft.displayName.trim(), email: this.draft.email.trim(), password: this.draft.password, role: this.draft.role });
    request.subscribe({
      next: () => { this.saving.set(false); this.notice.set(selected ? 'تغییرات حساب ذخیره شد.' : 'حساب کارمند ساخته شد.'); this.cancelEdit(); this.load(); },
      error: (error: unknown) => { this.saving.set(false); this.error.set(error instanceof HttpErrorResponse && error.status === 409 ? 'این نام کاربری قبلاً استفاده شده است.' : 'ذخیرهٔ حساب انجام نشد؛ اطلاعات را بررسی و دوباره تلاش کنید.'); },
    });
  }

  edit(account: StaffAccount): void {
    this.editing.set(account);
    this.draft = { username: account.username, displayName: account.displayName, email: account.email ?? '', password: '', role: account.role };
    this.notice.set(null); this.error.set(null);
  }

  cancelEdit(): void { this.editing.set(null); this.draft = this.emptyDraft(); }

  deactivate(account: StaffAccount): void {
    if (!window.confirm(`دسترسی «${account.displayName}» غیرفعال شود؟`)) return;
    this.service.deactivate(account.id).subscribe({
      next: () => { this.notice.set('حساب غیرفعال شد؛ سوابق آن حفظ شده است.'); this.load(); },
      error: () => this.error.set('غیرفعال‌سازی حساب انجام نشد.'),
    });
  }

  reactivate(account: StaffAccount): void {
    this.service.reactivate(account.id).subscribe({
      next: () => { this.notice.set('حساب دوباره فعال شد.'); this.load(); },
      error: () => this.error.set('فعال‌سازی حساب انجام نشد.'),
    });
  }

  private emptyDraft(): { username: string; displayName: string; email: string; password: string; role: StaffRole } {
    return { username: '', displayName: '', email: '', password: '', role: 'LIBRARIAN' };
  }
}
