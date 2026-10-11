/**
 * Reservation (رزرو) domain models.
 *
 * `GET /api/reservations/active` returns a plain JSON array (not a Spring `Page`
 * envelope), so there is deliberately no paginated wrapper for this feature.
 * The create endpoint takes its payload as query parameters
 * (`POST /api/reservations?personId=&bookId=&expiryDate=YYYY-MM-DD`), which is why
 * `CreateReservationRequest` is a flat shape that maps 1:1 onto those params.
 */

/** Lifecycle of a reservation as reported by the backend. */
export type ReservationStatus = 'ACTIVE' | 'FULFILLED' | 'EXPIRED' | 'CANCELLED';

/** One row of `GET /api/reservations/active`. */
export interface ReservationModel {
  id: number;
  personId: number;
  personFirstName: string | null;
  personLastName: string | null;
  bookId: number;
  bookTitle: string | null;
  /** ISO `yyyy-MM-dd` (server `LocalDate`). */
  reservationDate: string;
  /** ISO `yyyy-MM-dd` (server `LocalDate`). */
  expiryDate: string;
  status: ReservationStatus | string;
  notes?: string | null;
}

/** Payload of `POST /api/reservations`. */
export interface CreateReservationRequest {
  personId: number;
  bookId: number;
  /** ISO `yyyy-MM-dd`; must be today or later. */
  expiryDate: string;
}

/** Optional query filters accepted by `GET /api/reservations/active`. */
export interface ReservationFilterModel {
  personId?: number | null;
  bookId?: number | null;
}

/** Number of days a new reservation is valid for by default. */
export const DEFAULT_RESERVATION_DAYS = 14;

/** Adds `days` calendar days to `date` without mutating it. */
export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * Formats a `Date` as the ISO `yyyy-MM-dd` string the backend binds to `LocalDate`.
 *
 * Built from the *local* calendar parts on purpose: `toISOString()` converts to UTC
 * first, so a date entered as 2025-01-01 in a UTC+3:30 zone would be sent as
 * 2024-12-31 and silently grant the reservation a day it should not have.
 */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Today's local calendar date as `yyyy-MM-dd`, i.e. the minimum selectable expiry. */
export function todayIso(): string {
  return toIsoDate(new Date());
}

/** ISO `yyyy-MM-dd` (falling back to today+{@link DEFAULT_RESERVATION_DAYS}) for a new reservation. */
export function defaultExpiryIso(now: Date = new Date()): string {
  return toIsoDate(addDays(now, DEFAULT_RESERVATION_DAYS));
}
