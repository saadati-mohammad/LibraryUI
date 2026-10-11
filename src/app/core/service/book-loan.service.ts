import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BookLoanFilterModel, BookLoanModel, CreateLoanRequest } from '../model/bookLoanModel';
import { PaginatedResponse } from '../model/paginated-response.model';
import { buildQueryParams } from '../util/http-request.util';


@Injectable({
  providedIn: 'root'
})
export class BookLoanService {
  readonly baseUrl: string = `${environment.apiUrl}/loan`;

  private readonly http = inject(HttpClient);

  getLoanList(
    filters?: Partial<BookLoanFilterModel>,
    page = 0,
    size = 10,
    sort = 'id,desc'
  ): Observable<PaginatedResponse<BookLoanModel>> {
    // `buildQueryParams` keeps falsy-but-meaningful filters (`status: 'RETURNED'`, empty
    // vs. absent date bounds) while dropping unset ones.
    const params = buildQueryParams(filters, page, size, sort);
    return this.http.get<PaginatedResponse<BookLoanModel>>(this.baseUrl, { params });
  }

  createLoan(request: CreateLoanRequest): Observable<BookLoanModel> {
    return this.http.post<BookLoanModel>(this.baseUrl, request);
  }

  returnLoan(loanId: number): Observable<BookLoanModel> {
    return this.http.put<BookLoanModel>(`${this.baseUrl}/${loanId}/return`, {});
  }
}
