import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { BookFilterModel, BookModel } from '../model/bookModel';
import { ExcelImportResult, PaginatedResponse } from '../model/paginated-response.model';
import {
  buildEntityFormData,
  buildFileFormData,
  buildQueryParams,
} from '../util/http-request.util';

@Injectable({
  providedIn: 'root'
})
export class BookService {
  readonly baseUrl: string = `${environment.apiUrl}/book`;
  readonly baseUrlExcel: string = `${environment.apiUrl}`;

  private readonly http = inject(HttpClient);

  getBookList(
    filters?: Partial<BookFilterModel>,
    page = 0,
    size = 10,
    sort = 'id,desc'
  ): Observable<PaginatedResponse<BookModel>> {
    // `buildQueryParams` keeps falsy-but-meaningful filters (`active: false`, `copyCount: 0`).
    const params = buildQueryParams(filters, page, size, sort);
    return this.http.get<PaginatedResponse<BookModel>>(this.baseUrl, { params });
  }

  addBook(bookData: BookModel, bookCoverFile?: File): Observable<BookModel> {
    const formData = buildEntityFormData('book', bookData, {
      fileField: 'bookCoverFile',
      file: bookCoverFile,
    });
    return this.http.post<BookModel>(this.baseUrl, formData);
  }

  /**
   * Updates a book. The cover argument is tri-state (see {@link buildEntityFormData}):
   * `null` means "remove the stored cover", `undefined` means "keep it", a `File` means
   * "replace it".
   */
  updateBook(id: number, bookData: BookModel, bookCoverFile?: File | null): Observable<BookModel> {
    const formData = buildEntityFormData('book', bookData, {
      fileField: 'bookCoverFile',
      file: bookCoverFile,
    });
    return this.http.put<BookModel>(`${this.baseUrl}/${id}`, formData);
  }

  deleteBook(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getBookById(id: number): Observable<BookModel> {
    return this.http.get<BookModel>(`${this.baseUrl}/${id}`);
  }

  importBooksFromExcel(file: File): Observable<ExcelImportResult> {
    const url = `${this.baseUrlExcel}/excel-import/books`;

    // Backend returns a JSON envelope: { success, imported, message }.
    return this.http.post<ExcelImportResult>(url, buildFileFormData('file', file));
  }

  previewBooksFromExcel(file: File): Observable<ExcelImportResult> {
    const url = `${this.baseUrlExcel}/excel-import/books/preview`;
    return this.http.post<ExcelImportResult>(url, buildFileFormData('file', file));
  }
}
