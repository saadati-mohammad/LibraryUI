import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BookMetadata {
  title: string | null;
  author: string | null;
  publisher: string | null;
  isbn10: string | null;
  isbn13: string | null;
  publicationYear: number | null;
  pageCount: number | null;
  language: string | null;
  subject: string | null;
  subjects: string[];
}

@Injectable({ providedIn: 'root' })
export class BookMetadataService {
  private readonly http = inject(HttpClient);
  lookup(isbn: string): Observable<BookMetadata[]> {
    return this.http.get<BookMetadata[]>(`${environment.apiUrl}/book/metadata/isbn/${encodeURIComponent(isbn)}`);
  }
}
