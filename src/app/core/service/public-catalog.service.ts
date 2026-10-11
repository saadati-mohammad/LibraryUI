import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../model/paginated-response.model';
import { PublicBook, PublicCategory } from '../model/public-catalog.model';

@Injectable({ providedIn: 'root' })
export class PublicCatalogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/public`;

  list(options: { q?: string; subject?: string; page?: number; sort?: string } = {}): Observable<PaginatedResponse<PublicBook>> {
    let params = new HttpParams().set('page', options.page ?? 0).set('size', 12)
      .set('sort', options.sort ?? 'id,desc');
    if (options.q?.trim()) params = params.set('q', options.q.trim());
    if (options.subject?.trim()) params = params.set('subject', options.subject.trim());
    return this.http.get<PaginatedResponse<PublicBook>>(`${this.baseUrl}/books`, { params });
  }

  get(id: number): Observable<PublicBook> {
    return this.http.get<PublicBook>(`${this.baseUrl}/books/${id}`);
  }

  categories(): Observable<PublicCategory[]> {
    return this.http.get<PublicCategory[]>(`${this.baseUrl}/categories`);
  }

  coverUrl(id: number): string {
    return `${this.baseUrl}/books/${id}/cover`;
  }
}
