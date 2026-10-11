import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { PublicBook, PublicCategory } from '../../core/model/public-catalog.model';
import { PublicCatalogService } from '../../core/service/public-catalog.service';
import { PublicNavComponent } from '../../shared/component/public-nav/public-nav.component';

@Component({
  selector: 'app-public-home',
  imports: [RouterLink, PublicNavComponent],
  templateUrl: './public-home.component.html',
  styleUrl: './public-home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicHomeComponent implements OnInit {
  private readonly catalog = inject(PublicCatalogService);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  readonly books = signal<PublicBook[]>([]);
  readonly categories = signal<PublicCategory[]>([]);
  readonly loading = signal(true);
  readonly failed = signal(false);

  ngOnInit(): void {
    this.title.setTitle('کتابخانه | کشف کتاب‌های تازه');
    this.meta.updateTag({ name: 'description', content: 'در فهرست کتابخانه جست‌وجو کنید، موضوع‌های گوناگون را ببینید و کتاب بعدی‌تان را پیدا کنید.' });
    this.catalog.list({ page: 0, sort: 'id,desc' }).subscribe({
      next: page => { this.books.set(page.content); this.loading.set(false); },
      error: () => { this.failed.set(true); this.loading.set(false); },
    });
    this.catalog.categories().subscribe({ next: rows => this.categories.set(rows.slice(0, 8)) });
  }

  search(query: string): void {
    this.router.navigate(['/catalog'], { queryParams: query.trim() ? { q: query.trim() } : {} });
  }

  cover(bookId: number): string { return this.catalog.coverUrl(bookId); }
}
