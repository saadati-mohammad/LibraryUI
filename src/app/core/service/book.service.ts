import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private baseUrl = `${environment.apiUrl}/`;
  constructor(private http: HttpClient) { }

  getBookList(): Observable<any> {
    // این متد برای دریافت لیست کتاب‌ها از سرور استفاده می‌شود
    return this.http.get(this.baseUrl + 'book', {});
  }
  addBook(bookData: any): Observable<any> {
    // این متد برای ارسال اطلاعات کتاب جدید به سرور استفاده می‌شود
    return this.http.post(this.baseUrl + 'book', bookData);
  }
  deleteBook(bookId: number): Observable<any> {
    // این متد برای حذف یک کتاب بر اساس شناسه آن استفاده می‌شود
    return this.http.delete(`${this.baseUrl}book/${bookId}`);
  }
  updateBook(bookId: number, bookData: any): Observable<any> {
    // این متد برای به‌روزرسانی اطلاعات یک کتاب بر اساس شناسه آن استفاده می‌شود
    return this.http.put(`${this.baseUrl}book/${bookId}`, bookData);
  }
  getBookById(bookId: number): Observable<any> {
    // این متد برای دریافت اطلاعات یک کتاب بر اساس شناسه آن استفاده می‌شود
    return this.http.get(`${this.baseUrl}book/${bookId}`);
  }
  searchBooks(query: string): Observable<any> {
    // این متد برای جستجوی کتاب‌ها بر اساس یک عبارت استفاده می‌شود
    return this.http.get(`${this.baseUrl}book/search`, { params: { q: query } });
  }
  batchUploadBooks(file: File): Observable<any> {
    // این متد برای بارگذاری دسته‌ای کتاب‌ها از یک فایل استفاده می‌شود
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}book/batch-upload`, formData);
  }
}
