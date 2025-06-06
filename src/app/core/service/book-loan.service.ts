import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BookLoanFilterModel, BookLoanModel, CreateLoanRequest } from '../model/bookLoanModel';
import { PaginatedResponse } from './book.service';


@Injectable({
  providedIn: 'root'
})
export class BookLoanService {
  readonly baseUrl: string = `${environment.apiUrl}/loan`;

  constructor(private http: HttpClient) { }

  getLoanList(
    filters?: Partial<BookLoanFilterModel>,
    page: number = 0,
    size: number = 10,
    sort: string = 'id,desc'
  ): Observable<PaginatedResponse<BookLoanModel>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params = params.append(key, value);
        }
      });
    }
    return this.http.get<PaginatedResponse<BookLoanModel>>(this.baseUrl, { params });
  }

  createLoan(request: CreateLoanRequest): Observable<BookLoanModel> {
    return this.http.post<BookLoanModel>(this.baseUrl, request);
  }

  returnLoan(loanId: number): Observable<BookLoanModel> {
    return this.http.put<BookLoanModel>(`${this.baseUrl}/${loanId}/return`, {});
  }
}