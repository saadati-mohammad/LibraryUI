import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private baseUrl = `${environment.apiUrl}/`;
  constructor(private http: HttpClient) { }
  getBookList () {
    return this.http.get(this.baseUrl + 'books',{});
  }
}
