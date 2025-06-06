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
  profilePicture?: any; // File, string (URL), or byte[]
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