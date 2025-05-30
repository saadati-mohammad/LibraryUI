import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { BookModel } from '../model/bookModel';

// یک اینترفیس برای پاسخ‌های لیست که معمولا شامل محتوا و اطلاعات صفحه‌بندی هستند
export interface PaginatedResponse<T> {
  content: T[];
  totalElements?: number;
  totalPages?: number;
  pageNumber?: number;
  pageSize?: number;
  // سایر پراپرتی‌های مربوط به صفحه‌بندی اگر وجود دارد
}

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private readonly baseUrl = `${environment.apiUrl}/`; // readonly اضافه شد

  constructor(private http: HttpClient) { }

  getBookList(filters?: any): Observable<PaginatedResponse<BookModel>> {
    // اگر فیلترهایی برای ارسال به عنوان query params وجود دارد
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          params = params.append(key, filters[key]);
        }
      });
    }
    return this.http.get<PaginatedResponse<BookModel>>(`${this.baseUrl}book`, { params });
  }

  getBookById(bookId: number): Observable<BookModel> {
    return this.http.get<BookModel>(`${this.baseUrl}book/${bookId}`);
  }

  addBook(bookData: BookModel): Observable<BookModel> { // معمولا کتاب ایجاد شده بازگردانده می‌شود
    return this.http.post<BookModel>(`${this.baseUrl}book`, bookData);
  }

  updateBook(bookId: number, bookData: BookModel): Observable<BookModel> { // معمولا کتاب بروز شده بازگردانده می‌شود
    return this.http.put<BookModel>(`${this.baseUrl}book/${bookId}`, bookData);
  }

  deleteBook(bookId: number): Observable<void> { // برای حذف معمولا پاسخ ۲0۴ No Content است
    return this.http.delete<void>(`${this.baseUrl}book/${bookId}`);
  }

  batchUploadBooks(model: any): Observable<any> { // تایپ 'model' و بازگشتی را دقیق‌تر کنید اگر ساختار مشخص است
    // const formData = new FormData();
    // formData.append('file', file);
    return this.http.post(`${this.baseUrl}book/batch-upload`, model);
  }
}