import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardSummaryModel } from '../model/dashboard.model';

/** Aggregated dashboard figures. A single request replaces the old six-request fan-out. */
@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  readonly baseUrl: string = `${environment.apiUrl}/dashboard`;

  private readonly http = inject(HttpClient);

  getSummary(): Observable<DashboardSummaryModel> {
    return this.http.get<DashboardSummaryModel>(`${this.baseUrl}/summary`);
  }
}
