import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateReservationRequest,
  ReservationFilterModel,
  ReservationModel,
} from '../model/reservation.model';
import { buildQueryParams } from '../util/http-request.util';

/** Wire shape returned by Spring's ReservationDto. Keep nested API data out of views. */
interface ReservationApiResponse {
  id: number;
  reservationDate: string;
  expiryDate: string;
  status: string;
  person: { id: number; firstName: string | null; lastName: string | null };
  book: { id: number; title: string | null };
}

function toReservationModel(response: ReservationApiResponse): ReservationModel {
  return {
    id: response.id,
    personId: response.person.id,
    personFirstName: response.person.firstName,
    personLastName: response.person.lastName,
    bookId: response.book.id,
    bookTitle: response.book.title,
    reservationDate: response.reservationDate,
    expiryDate: response.expiryDate,
    status: response.status,
  };
}

/**
 * Reservation endpoints.
 *
 * Note the two different request shapes the backend expects:
 *  * `GET /api/reservations/active` takes no paging params and answers a **plain array**;
 *  * `POST /api/reservations` takes `personId`/`bookId`/`expiryDate` as **query params**
 *    (not a JSON body), which `buildQueryParams` already produces, with null/empty
 *    entries dropped so an omitted filter is never serialised as `personId=null`.
 */
@Injectable({
  providedIn: 'root',
})
export class ReservationService {
  readonly baseUrl: string = `${environment.apiUrl}/reservations`;

  private readonly http = inject(HttpClient);

  /** Active reservations. `filters` are optional (server returns every active row). */
  getActiveReservations(filters?: Partial<ReservationFilterModel>): Observable<ReservationModel[]> {
    const params = buildQueryParams(filters, 0, 100);
    return this.http
      .get<ReservationApiResponse[]>(`${this.baseUrl}/active`, { params })
      .pipe(map((rows) => rows.map(toReservationModel)));
  }

  /** Creates a reservation; the payload travels as query parameters. */
  createReservation(request: CreateReservationRequest): Observable<ReservationModel> {
    const params = buildQueryParams(request);
    return this.http
      .post<ReservationApiResponse>(this.baseUrl, null, { params })
      .pipe(map(toReservationModel));
  }

  /** Marks a reservation as fulfilled (the book was handed to the member). */
  fulfillReservation(id: number): Observable<ReservationModel> {
    return this.http
      .put<ReservationApiResponse>(`${this.baseUrl}/${id}/fulfill`, {})
      .pipe(map(toReservationModel));
  }

  /** Cancels an active reservation and keeps the historical state on the server. */
  cancelReservation(id: number): Observable<ReservationModel> {
    return this.http
      .put<ReservationApiResponse>(`${this.baseUrl}/${id}/cancel`, {})
      .pipe(map(toReservationModel));
  }
}
