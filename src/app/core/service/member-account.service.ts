import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../model/paginated-response.model';
import { MemberLoan, MemberProfile, MemberReservation } from '../model/public-catalog.model';

@Injectable({ providedIn: 'root' })
export class MemberAccountService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/account`;
  profile(): Observable<MemberProfile> { return this.http.get<MemberProfile>(`${this.url}/me`); }
  updatePhone(phone: string): Observable<MemberProfile> { return this.http.patch<MemberProfile>(`${this.url}/profile`, { phone }); }
  loans(): Observable<PaginatedResponse<MemberLoan>> { return this.http.get<PaginatedResponse<MemberLoan>>(`${this.url}/loans`, { params: new HttpParams().set('page', 0).set('size', 25) }); }
  reservations(): Observable<MemberReservation[]> { return this.http.get<MemberReservation[]>(`${this.url}/reservations`); }
  reserve(bookId: number): Observable<MemberReservation> { return this.http.post<MemberReservation>(`${this.url}/reservations`, { bookId }); }
  cancelReservation(id: number): Observable<void> { return this.http.delete<void>(`${this.url}/reservations/${id}`); }
}
