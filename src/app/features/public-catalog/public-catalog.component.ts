import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { PublicBook, PublicCategory } from '../../core/model/public-catalog.model';
import { PublicCatalogService } from '../../core/service/public-catalog.service';
import { PublicNavComponent } from '../../shared/component/public-nav/public-nav.component';

@Component({
  selector: 'app-public-catalog', imports: [RouterLink, PublicNavComponent],
  templateUrl: './public-catalog.component.html', styleUrl: './public-catalog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicCatalogComponent implements OnInit {
  private readonly service = inject(PublicCatalogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  readonly books = signal<PublicBook[]>([]);
  readonly categories = signal<PublicCategory[]>([]);
  readonly query = signal('');
  readonly subject = signal('');
  readonly sort = signal('id,desc');
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);
  readonly loading = signal(true);
  readonly error = signal(false);

  ngOnInit(): void {
    this.title.setTitle('فهرست کتاب‌ها | کتابخانه');
    this.meta.updateTag({ name: 'description', content: 'جست‌وجو و مرور کتاب‌های ثبت‌شده در فهرست کتابخانه.' });
    this.service.categories().subscribe({ next: items => this.categories.set(items), error: () => undefined });
    this.route.queryParamMap.subscribe(params => {
      this.query.set(params.get('q') ?? '');
      this.subject.set(params.get('subject') ?? '');
      this.page.set(Number(params.get('page') ?? 0) || 0);
      this.load();
    });
  }

  submitSearch(query: string): void { this.navigate({ q: query.trim() || null, page: null }); }
  chooseSubject(subject: string): void { this.navigate({ subject: subject || null, page: null }); }
  changeSort(sort: string): void { this.sort.set(sort); this.page.set(0); this.load(); }
  go(delta: number): void { this.navigate({ page: Math.max(0, this.page() + delta) }); }
  retry(): void { this.load(); }
  clearFilters(): void { this.router.navigate([], { relativeTo: this.route, queryParams: { q: null, subject: null, page: null }, queryParamsHandling: 'merge' }); }
  cover(id: number): string { return this.service.coverUrl(id); }

  private navigate(queryParams: Record<string, string | number | null>): void {
    this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' });
  }
  private load(): void {
    this.loading.set(true); this.error.set(false);
    this.service.list({ q: this.query(), subject: this.subject(), page: this.page(), sort: this.sort() })
      .subscribe({ next: result => { this.books.set(result.content); this.totalPages.set(result.totalPages); this.totalElements.set(result.totalElements); this.loading.set(false); },
        error: () => { this.error.set(true); this.loading.set(false); } });
  }
}
