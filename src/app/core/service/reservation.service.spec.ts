import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ReservationService } from './reservation.service';
import { CreateReservationRequest, ReservationModel } from '../model/reservation.model';
import { environment } from '../../../environments/environment';

const ACTIVE_URL = `${environment.apiUrl}/reservations/active`;

describe('ReservationService', () => {
  let service: ReservationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReservationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lists the active reservations with GET and no filter params when none are given', () => {
    const rows: ReservationModel[] = [
      {
        id: 1,
        personId: 7,
        personFirstName: 'علی',
        personLastName: 'محمدی',
        bookId: 3,
        bookTitle: 'بوف کور',
        reservationDate: '2025-01-10',
        expiryDate: '2025-01-24',
        status: 'ACTIVE',
      },
    ];

    let received: ReservationModel[] | undefined;
    service.getActiveReservations().subscribe((res) => (received = res));

    const req = httpMock.expectOne((r) => r.url === ACTIVE_URL);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.has('personId')).toBe(false);
    expect(req.request.params.has('bookId')).toBe(false);
    req.flush([
      {
        id: 1,
        reservationDate: '2025-01-10',
        expiryDate: '2025-01-24',
        status: 'ACTIVE',
        person: { id: 7, firstName: 'علی', lastName: 'محمدی' },
        book: { id: 3, title: 'بوف کور' },
      },
    ]);

    expect(received).toEqual(rows);
  });

  it('forwards person/book filters as query params and drops empty ones', () => {
    service.getActiveReservations({ personId: 12, bookId: null }).subscribe();

    const req = httpMock.expectOne((r) => r.url === ACTIVE_URL);
    expect(req.request.params.get('personId')).toBe('12');
    expect(req.request.params.has('bookId')).toBe(false);
    req.flush([]);
  });

  it('creates a reservation with the payload as query params and a null body', () => {
    const request: CreateReservationRequest = { personId: 5, bookId: 9, expiryDate: '2025-02-01' };

    service.createReservation(request).subscribe();

    const req = httpMock.expectOne((r) => r.url === service.baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.params.get('personId')).toBe('5');
    expect(req.request.params.get('bookId')).toBe('9');
    expect(req.request.params.get('expiryDate')).toBe('2025-02-01');
    expect(req.request.body).toBeNull();
    req.flush({
      id: 1,
      reservationDate: '2025-01-10',
      expiryDate: request.expiryDate,
      status: 'ACTIVE',
      person: { id: request.personId, firstName: 'علی', lastName: 'محمدی' },
      book: { id: request.bookId, title: 'بوف کور' },
    });
  });

  it('fulfils a reservation with PUT on the dedicated endpoint', () => {
    service.fulfillReservation(42).subscribe();

    const req = httpMock.expectOne(`${service.baseUrl}/42/fulfill`);
    expect(req.request.method).toBe('PUT');
    req.flush({
      id: 42,
      reservationDate: '2025-01-10',
      expiryDate: '2025-01-24',
      status: 'FULFILLED',
      person: { id: 7, firstName: 'علی', lastName: 'محمدی' },
      book: { id: 3, title: 'بوف کور' },
    });
  });

  it('cancels a reservation with PUT on the dedicated endpoint', () => {
    service.cancelReservation(43).subscribe((reservation) => {
      expect(reservation.status).toBe('CANCELLED');
    });

    const req = httpMock.expectOne(`${service.baseUrl}/43/cancel`);
    expect(req.request.method).toBe('PUT');
    req.flush({
      id: 43,
      reservationDate: '2025-01-10',
      expiryDate: '2025-01-24',
      status: 'CANCELLED',
      person: { id: 7, firstName: 'علی', lastName: 'محمدی' },
      book: { id: 3, title: 'بوف کور' },
    });
  });
});
