// src/app/core/model/person.model.ts

export interface PersonModel {
  id?: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  nationalId: string | null;
  phone?: string | null;
  birthDate?: string | null; // تاریخ به صورت رشته YYYY-MM-DD
  membershipDate?: string | null;
  membershipType?: string | null;
  address?: string | null;
  notes?: string | null;
  // File while editing in the form, or a string (URL / binary text) from the API.
  // Note: the API deliberately does NOT serialize the picture bytes, so this is normally
  // absent on responses — use `hasPicture` + `GET /api/person/{id}/picture` instead.
  profilePicture?: File | string | null;
  /**
   * Server flag: the member has a stored photo retrievable from
   * `GET /api/person/{id}/picture`. Gates the (authenticated) image request.
   */
  hasPicture?: boolean;
  active: boolean;
}

export interface PersonFilterModel {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  nationalId?: string | null;
  membershipType?: string | null;
  address?: string | null;
  active?: boolean | null; // null for all, true for active, false for inactive
  membershipDateFrom?: string | null;
  membershipDateTo?: string | null;
}