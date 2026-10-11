import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { PublicCategory } from '../../core/model/public-catalog.model';
import { PublicCatalogService } from '../../core/service/public-catalog.service';
import { PublicNavComponent } from '../../shared/component/public-nav/public-nav.component';

@Component({ selector: 'app-public-categories', imports: [RouterLink, PublicNavComponent], template: `
  <app-public-nav/><main class="categories"><p class="eyebrow">فهرست موضوعی</p><h1>از موضوع دلخواهتان شروع کنید</h1><p class="lead">موضوع‌ها از اطلاعات کتاب‌های فعال فهرست شده‌اند.</p>
  @if(loading()){<p role="status">در حال دریافت موضوع‌ها…</p>}@else if(error()){<p role="alert">دریافت موضوع‌ها ممکن نشد. لطفاً دوباره تلاش کنید.</p><button (click)="load()">تلاش دوباره</button>}@else if(!items().length){<p class="empty">هنوز موضوعی در فهرست کتابخانه ثبت نشده است.</p>}@else{<div class="grid">@for(item of items();track item.name){<a routerLink="/catalog" [queryParams]="{subject:item.name}"><span aria-hidden="true">✳</span><strong>{{item.name}}</strong><small>{{item.titleCount}} عنوان</small><b aria-hidden="true">←</b></a>}</div>}</main>
  <footer><a routerLink="/">بازگشت به صفحهٔ اصلی</a></footer>
`, styles: [`:host{display:block;min-height:100vh;background:#f8faf7;color:#183c33}.categories{width:min(1080px,calc(100% - 40px));margin:auto;padding:50px 0 80px}.eyebrow{color:#34745f;font-weight:bold}.categories h1{font-size:clamp(2rem,5vw,3.1rem);margin:0}.lead{color:#62766d;margin:10px 0 26px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.grid a{position:relative;display:grid;grid-template-columns:35px 1fr;align-items:center;gap:5px 12px;padding:20px;background:#fff;border:1px solid #dfe8e3;border-radius:15px;color:inherit;text-decoration:none}.grid a:hover{border-color:#68a588}.grid a>span{grid-row:span 2;color:#4b896e;font-size:1.6rem}.grid strong{overflow-wrap:anywhere}.grid small{color:#62766d}.grid b{position:absolute;left:17px;color:#50816d}.empty{padding:28px;background:#fff;border-radius:14px;color:#62766d}footer{text-align:center;padding:22px;border-top:1px solid #dfe8e3}footer a{color:#155e4b;text-decoration:none;font-weight:bold}@media(max-width:720px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){.grid{grid-template-columns:1fr}.categories{width:calc(100% - 32px);padding-top:32px}}`],
  changeDetection: ChangeDetectionStrategy.OnPush })
export class PublicCategoriesComponent implements OnInit {
  private readonly service = inject(PublicCatalogService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  readonly items = signal<PublicCategory[]>([]); readonly loading = signal(true); readonly error = signal(false);
  ngOnInit(): void { this.title.setTitle('موضوع‌های کتاب | کتابخانه'); this.meta.updateTag({name:'description',content:'مرور دسته‌بندی‌های واقعی کتابخانه.'}); this.load(); }
  load(): void { this.loading.set(true);this.error.set(false);this.service.categories().subscribe({next:items=>{this.items.set(items);this.loading.set(false);},error:()=>{this.error.set(true);this.loading.set(false);}}); }
}
