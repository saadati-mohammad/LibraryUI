import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Calendar-date validators for the ISO (`yyyy-MM-dd`) strings that `<input type="date">`
 * and the backend's `LocalDate` fields both use.
 *
 * They live in one place because the book publication-date, the member birth-date and
 * the reservation expiry-date rules are the same rule with different bounds, and the
 * previous free-text inputs validated none of them.
 */

/** Parses an ISO `yyyy-MM-dd` string into a local-noon Date, or null when malformed. */
export function parseIsoDate(value: unknown): Date | null {
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0, 0);
  // Rejects rollovers such as 2025-02-31, which the Date constructor would accept.
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }
  return date;
}

/** Midnight today, in local time — the reference point for "not in the future". */
function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Validator: the value must be empty or a real calendar date. */
export const isoDate: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return parseIsoDate(value) ? null : { isoDate: true };
};

/**
 * Validator: the value must be empty or today-or-earlier.
 *
 * Used for a member's birth date and a book's publication date. Compared at day
 * granularity so "today" is always valid regardless of the time of day.
 */
export const notFutureDate: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const date = parseIsoDate(control.value);
  if (!date) {
    return null;
  }
  return date.getTime() <= startOfToday().getTime() ? null : { notFutureDate: true };
};

/** Validator: the value must be empty or today-or-later (a reservation expiry). */
export const notPastDate: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const date = parseIsoDate(control.value);
  if (!date) {
    return null;
  }
  return date.getTime() >= startOfToday().getTime() ? null : { notPastDate: true };
};
