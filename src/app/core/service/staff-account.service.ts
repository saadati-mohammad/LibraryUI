import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateStaffAccount, StaffAccount, UpdateStaffAccount } from '../model/staff-account.model';

@Injectable({ providedIn: 'root' })
export class StaffAccountService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/staff-accounts`;

  list(): Observable<StaffAccount[]> { return this.http.get<StaffAccount[]>(this.baseUrl); }
  create(request: CreateStaffAccount): Observable<StaffAccount> {
    return this.http.post<StaffAccount>(this.baseUrl, request);
  }
  update(id: number, request: UpdateStaffAccount): Observable<StaffAccount> {
    return this.http.put<StaffAccount>(`${this.baseUrl}/${id}`, request);
  }
  deactivate(id: number): Observable<StaffAccount> {
    return this.http.delete<StaffAccount>(`${this.baseUrl}/${id}`);
  }
  reactivate(id: number): Observable<StaffAccount> {
    return this.http.post<StaffAccount>(`${this.baseUrl}/${id}/reactivate`, {});
  }
}
