export interface PublicBook {
  id: number;
  title: string;
  author: string;
  publisher: string | null;
  isbn13: string | null;
  summary: string | null;
  description: string | null;
  subject: string | null;
  publicationDate: string | null;
  pageCount: number | null;
  language: string | null;
  edition: string | null;
  copyCount: number | null;
  hasCover: boolean;
}

export interface PublicCategory {
  name: string;
  titleCount: number;
}

export interface MemberProfile {
  id: number; firstName: string; lastName: string; email: string; phone: string | null;
  membershipDate: string | null; membershipType: string | null; active: boolean;
}
export interface MemberLoan {
  id: number; title: string; author: string; loanDate: string; dueDate: string;
  returnDate: string | null; status: 'ON_LOAN' | 'OVERDUE' | 'RETURNED';
}
export interface MemberReservation {
  id: number; bookId: number; title: string; author: string;
  reservationDate: string; expiryDate: string | null; status: string;
}
