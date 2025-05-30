import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoansService {
  private baseUrl = `${environment.apiUrl}/`;
  constructor(private http: HttpClient) { }
  getLoanList (): Observable<any> {
    // این متد برای دریافت لیست امانت ها از سرور استفاده می‌شود
    return this.http.get(this.baseUrl + 'loan',{});
  }
  addLoan(loanData: any): Observable<any> {
    // این متد برای ارسال اطلاعات امانت جدید به سرور استفاده می‌شود
    return this.http.post(this.baseUrl + 'loan', loanData);
  }
  deleteLoan(loanId: number): Observable<any> {
    // این متد برای حذف یک امانت بر اساس شناسه آن استفاده می‌شود
    return this.http.delete(`${this.baseUrl}loan/${loanId}`);
  }
  updateLoan(loanId: number, loanData: any): Observable<any> {
    // این متد برای به‌روزرسانی اطلاعات یک امانت بر اساس شناسه آن استفاده می‌شود
    return this.http.put(`${this.baseUrl}loan/${loanId}`, loanData);
  }
  getLoanById(loanId: number): Observable<any> {
    // این متد برای دریافت اطلاعات یک امانت بر اساس شناسه آن استفاده می‌شود
    return this.http.get(`${this.baseUrl}loan/${loanId}`);
  }

}
