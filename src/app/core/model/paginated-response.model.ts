/**
 * Shared pagination envelope returned by Spring Data `Page<T>` serialization.
 *
 * Previously this interface was duplicated (and drift-prone) in both
 * `book.service.ts` and `person.service.ts`. Keep a single definition here.
 */
export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  /** Current page number (0-indexed). */
  number: number;
  first?: boolean;
  last?: boolean;
  numberOfElements?: number;
  empty?: boolean;
}

/**
 * Envelope returned by the Excel import endpoints
 * (`/api/excel-import/books` and `/api/excel-import/persons`).
 */
export interface ExcelImportResult {
  success: boolean;
  imported?: number;
  message: string;
}
