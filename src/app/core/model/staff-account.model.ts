export type StaffRole = 'ADMIN' | 'LIBRARIAN';

export interface StaffAccount {
  id: number;
  username: string;
  displayName: string;
  email: string | null;
  role: StaffRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffAccount {
  username: string;
  displayName: string;
  email: string;
  password: string;
  role: StaffRole;
}

export interface UpdateStaffAccount {
  displayName: string;
  email: string;
  role: StaffRole;
  password: string | null;
}
