export interface BookModel {
  id?: number;
  isbn10: string | null;
  title: string | null;
  author: string | null;
  translator?: string | null;
  description?: string | null;
  publisher?: string | null;
  isbn13?: string | null;
  deweyDecimal?: string | null;
  congressClassification?: string | null;
  subject?: string | null;
  summary?: string | null;
  publicationDate?: string | null; // یا Date اگر از DatePicker استفاده می‌کنید
  pageCount?: number | null;
  language?: string | null;
  edition?: string | null;
  active: boolean;
  // File while editing in the form, or a string (URL / binary text) when it comes back
  // from the API. Note: the API deliberately does NOT serialize the cover bytes, so this
  // is normally absent on responses — use `hasCover` + `GET /api/book/{id}/cover` instead.
  bookCoverFile?: File | string | null;
  /**
   * Server flag: the book has a stored cover retrievable from
   * `GET /api/book/{id}/cover`. Gates the (authenticated) image request.
   */
  hasCover?: boolean;
  copyCount?: number | null;
  librarySection?: string | null;
  shelfCode?: string | null;
  rowNumbers?: string | null;
  columnNumber?: string | null;
  positionNote?: string | null;
}

// --- BEGIN ADDITION ---
export interface BookFilterModel {
  title?: string | null;
  author?: string | null;
  translator?: string | null;
  publisher?: string | null;
  isbn10?: string | null;
  isbn13?: string | null;
  description?: string | null;
  deweyDecimal?: string | null;
  congressClassification?: string | null;
  subject?: string | null;
  summary?: string | null;
  publicationDate?: string | null; // یا Date
  pageCount?: number | null;
  language?: string | null;
  edition?: string | null;
  active?: boolean | null; // Boolean can be true, false, or null (don't filter by active)
  copyCount?: number | null;
  librarySection?: string | null;
  shelfCode?: string | null;
  rowNumbers?: string | null;
  columnNumber?: string | null;
  positionNote?: string | null;
}
// --- END ADDITION ---
