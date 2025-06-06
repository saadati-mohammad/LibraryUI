export type LoanStatus = 'ON_LOAN' | 'RETURNED' | 'OVERDUE';

export interface BookLoanModel {
  id: number;
  loanDate: string;
  dueDate: string;
  returnDate: string | null;
  status: LoanStatus;
  notes: string | null;
  personId: number;
  personFirstName: string;
  personLastName: string;
  bookId: number;
  bookTitle: string;
}

export interface BookLoanFilterModel {
  personNationalId?: string;
  bookIsbn?: string;
  status?: LoanStatus | null;
  dueDateFrom?: string;
  dueDateTo?: string;
}

export interface CreateLoanRequest {
  personId: number;
  bookId: number;
  notes?: string;
}