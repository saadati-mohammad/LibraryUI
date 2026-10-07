import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BookLoanFilterModel, BookLoanModel, CreateLoanRequest } from '../model/bookLoanModel';
import { PaginatedResponse } from '../model/paginated-response.model';


@Injectable({
  providedIn: 'root'
})
export class BookLoanService {
  readonly baseUrl: string = `${environment.apiUrl}/loan`;

  constructor(private http: HttpClient) { }

  getLoanList(
    filters?: Partial<BookLoanFilterModel>,
    page = 0,
    size = 10,
    sort = 'id,desc'
  ): Observable<PaginatedResponse<BookLoanModel>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          // Coerce to string: HttpParams rejects non-string values and `false`/`0`
          // would otherwise be dropped or stringified inconsistently.
          params = params.append(key, String(value));
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