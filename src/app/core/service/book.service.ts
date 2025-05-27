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
  getBookList (): Observable<any> {
    // این متد برای دریافت لیست کتاب‌ها از سرور استفاده می‌شود
    return this.http.get(this.baseUrl + 'books',{});
  }
}
