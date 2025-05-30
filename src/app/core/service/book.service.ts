import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { BookModel } from '../model/bookModel';

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
  getBookById(bookId: number): Observable<any> {
    // این متد برای دریافت اطلاعات یک کتاب بر اساس شناسه آن استفاده می‌شود
    return this.http.get(`${this.baseUrl}book/${bookId}`);
  }
  addBook(bookData: BookModel): Observable<any> {
    // این متد برای ارسال اطلاعات کتاب جدید به سرور استفاده می‌شود
    return this.http.post(this.baseUrl + 'book', bookData);
  }
  updateBook(bookId: number, bookData: BookModel): Observable<any> {
    // این متد برای به‌روزرسانی اطلاعات یک کتاب بر اساس شناسه آن استفاده می‌شود
    return this.http.put(`${this.baseUrl}book/${bookId}`, bookData);
  }
  deleteBook(bookId: number): Observable<any> {
    // این متد برای حذف یک کتاب بر اساس شناسه آن استفاده می‌شود
    return this.http.delete(`${this.baseUrl}book/${bookId}`);
  }

  batchUploadBooks(model: any): Observable<any> {
    // این متد برای بارگذاری دسته‌ای کتاب‌ها از یک فایل استفاده می‌شود
    // const formData = new FormData();
    // formData.append('file', file);
    return this.http.post(`${this.baseUrl}book/batch-upload`, model);
  }
}
