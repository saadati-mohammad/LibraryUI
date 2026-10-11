import { HttpParams } from '@angular/common/http';

/**
 * Shared HTTP request builders.
 *
 * `BookService`, `PersonService` and `BookLoanService` used to carry three near-identical
 * copies of the same two blocks (query-param assembly and entity multipart assembly).
 * They are pure functions here so the behaviour can be locked down by unit tests once
 * instead of three times.
 */

/**
 * Builds the paging/sorting params plus one entry per meaningful filter value.
 *
 * `null`, `undefined` and `''` are skipped because they mean "no filter". Falsy but
 * meaningful values are KEPT and stringified: `active=false` means "only inactive rows"
 * and `copyCount=0` means "no copies", so dropping them (the classic
 * `if (value) { … }` bug, or the type error from passing a raw boolean to `HttpParams`)
 * would silently widen the result set.
 */
export function buildQueryParams(
  filters?: object | null,
  page = 0,
  size = 10,
  sort = 'id,desc',
): HttpParams {
  let params = new HttpParams()
    .set('page', page.toString())
    .set('size', size.toString())
    .set('sort', sort);

  if (filters) {
    Object.entries(filters as Record<string, unknown>).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.append(key, String(value));
      }
    });
  }

  return params;
}

/** Options for {@link buildEntityFormData}. */
export interface EntityUpload {
  /** Name of the multipart part that carries the file (e.g. `bookCoverFile`). */
  fileField: string;
  /**
   * Tri-state, and the three states mean different things to the backend:
   *  * `File`      — upload this file;
   *  * `null`      — delete the file currently stored on the server;
   *  * `undefined` — leave the stored file untouched.
   */
  file?: File | null;
}

/**
 * Builds the multipart body used by the book/person create and update endpoints: the
 * entity serialised as a JSON `Blob` under `entityField`, plus an optional file part.
 *
 * The tri-state handling of {@link EntityUpload.file} lives here so create and update
 * cannot drift apart: for `null` the file field is explicitly nulled *inside* the JSON
 * entity (the only signal the backend gets that the picture must be cleared) and no file
 * part is added; for a `File` the part is appended under the same field name.
 */
export function buildEntityFormData<T extends object>(
  entityField: string,
  entity: T,
  upload?: EntityUpload,
): FormData {
  const formData = new FormData();
  const fileField = upload?.fileField;
  const file = upload?.file;

  const payload: object = file === null && fileField ? { ...entity, [fileField]: null } : entity;

  formData.append(entityField, jsonBlob(payload));

  if (fileField && file instanceof File) {
    formData.append(fileField, file, file.name);
  }

  return formData;
}

/** Builds a single-file multipart body (the Excel import endpoints). */
export function buildFileFormData(fileField: string, file: File): FormData {
  const formData = new FormData();
  formData.append(fileField, file, file.name);
  return formData;
}

/**
 * `JSON.stringify` produces a string, but the multipart part must advertise
 * `application/json`; wrapping it in a Blob is what the backend binds to its DTO.
 */
function jsonBlob(payload: unknown): Blob {
  return new Blob([JSON.stringify(payload)], { type: 'application/json' });
}
