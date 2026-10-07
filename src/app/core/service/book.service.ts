import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { BookFilterModel, BookModel } from '../model/bookModel';
import { ExcelImportResult, PaginatedResponse } from '../model/paginated-response.model';

@Injectable({
  providedIn: 'root'
})
export class BookService {
  readonly baseUrl: string = `${environment.apiUrl}/book`;
  readonly baseUrlExcel: string = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  getBookList(
    filters?: Partial<BookFilterModel>,
    page: number = 0,
    size: number = 10,
    sort: string = 'id,desc'
  ): Observable<PaginatedResponse<BookModel>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as Record<string, unknown>)[key];
        if (value !== null && value !== undefined && value !== '') {
          // Coerce booleans/numbers to string so `false` and `0` are actually sent.
          params = params.append(key, String(value));
        }
      });
    }
    return this.http.get<PaginatedResponse<BookModel>>(this.baseUrl, { params });
  }

  addBook(bookData: BookModel, bookCoverFile?: File): Observable<BookModel> {
    const formData = new FormData();
    formData.append('book', new Blob([JSON.stringify(bookData)], { type: 'application/json' }));
    if (bookCoverFile) {
      formData.append('bookCoverFile', bookCoverFile, bookCoverFile.name);
    }
    return this.http.post<BookModel>(this.baseUrl, formData);
  }

  updateBook(id: number, bookData: BookModel, bookCoverFile?: File | null): Observable<BookModel> {
    // اگر bookCoverFile === null باشد، یعنی کاربر می‌خواهد عکس را حذف کند و فایلی آپلود نکرده.
    // اگر bookCoverFile === undefined باشد، یعنی کاربر عکس را تغییر نداده.
    // اگر bookCoverFile یک File باشد، یعنی عکس جدید آپلود شده.

    const formData = new FormData();
    // اگر قرار است فیلد bookCoverFile در BookModel سمت سرور null شود برای حذف عکس،
    // باید در bookData این فیلد را null کنیم اگر bookCoverFile === null است.
    if (bookCoverFile === null) {
        // این به سرور سیگنال می‌دهد که فایل جلد باید حذف شود (اگر سرور این منطق را دارد)
        // یا اینکه BookModel ارسالی فیلد bookCoverFile را نداشته باشد.
        // فعلا فرض می‌کنیم null کردن فیلد در JSON کافی است.
        const bookDataWithoutCover = { ...bookData, bookCoverFile: null };
        formData.append('book', new Blob([JSON.stringify(bookDataWithoutCover)], { type: 'application/json' }));
    } else {
        formData.append('book', new Blob([JSON.stringify(bookData)], { type: 'application/json' }));
    }


    if (bookCoverFile instanceof File) { // فقط اگر فایل جدیدی انتخاب شده باشد
      formData.append('bookCoverFile', bookCoverFile, bookCoverFile.name);
    }
    // اگر bookCoverFile undefined باشد، هیچ فایل یا اطلاعاتی در مورد فایل ارسال نمی‌شود،
    // و سرور باید جلد موجود را حفظ کند.
    // اگر bookCoverFile null باشد، formData شامل bookCoverFile نخواهد بود (یا مقدارش null است، بسته به اینکه چطور در JSON قرار می‌گیرد)
    // و سرور باید جلد را حذف کند.

    return this.http.put<BookModel>(`${this.baseUrl}/${id}`, formData);
  }
  // --- END MODIFICATION ---

  // متد قدیمی addBook و آپدیت اگر هنوز استفاده می‌شوند و فرمت application/json ساده ارسال می‌کنند:
  // addBookOld(bookData: BookModel): Observable<BookModel> {
  //   return this.http.post<BookModel>(this.apiUrl, bookData);
  // }
  // updateBookOld(id: number, bookData: BookModel): Observable<BookModel> {
  //   return this.http.put<BookModel>(`${this.apiUrl}/${id}`, bookData);
  // }

  deleteBook(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getBookById(id: number): Observable<BookModel> { // اگر نیاز به دریافت کتاب برای ویرایش دارید
    return this.http.get<BookModel>(`${this.baseUrl}/${id}`);
  }

  importBooksFromExcel(file: File): Observable<ExcelImportResult> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    const url = `${this.baseUrlExcel}/excel-import/books`;

    // Backend returns a JSON envelope: { success, imported, message }.
    return this.http.post<ExcelImportResult>(url, formData);
  }
}