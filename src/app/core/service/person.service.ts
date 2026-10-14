import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PersonFilterModel, PersonModel } from '../model/personModel';
import { ExcelImportResult, PaginatedResponse } from '../model/paginated-response.model';
import {
  buildEntityFormData,
  buildFileFormData,
  buildQueryParams,
} from '../util/http-request.util';

@Injectable({
  providedIn: 'root'
})
export class PersonService {
  readonly baseUrl: string = `${environment.apiUrl}/person`;
  readonly baseUrlExcel: string = `${environment.apiUrl}`;

  private readonly http = inject(HttpClient);

  getPersonList(
    filters?: Partial<PersonFilterModel>,
    page = 0,
    size = 10,
    sort = 'id,desc'
  ): Observable<PaginatedResponse<PersonModel>> {
    // `buildQueryParams` keeps falsy-but-meaningful filters (`active: false`).
    const params = buildQueryParams(filters, page, size, sort);
    return this.http.get<PaginatedResponse<PersonModel>>(this.baseUrl, { params });
  }

  addPerson(personData: PersonModel, profilePicture?: File): Observable<PersonModel> {
    const formData = buildEntityFormData('person', personData, {
      fileField: 'profilePicture',
      file: profilePicture,
    });
    return this.http.post<PersonModel>(this.baseUrl, formData);
  }

  /**
   * Updates a person. The picture argument is tri-state (see {@link buildEntityFormData}):
   * `null` means "remove the stored picture", `undefined` means "keep it", a `File` means
   * "replace it".
   */
  updatePerson(id: number, personData: PersonModel, profilePicture?: File | null): Observable<PersonModel> {
    const formData = buildEntityFormData('person', personData, {
      fileField: 'profilePicture',
      file: profilePicture,
    });
    return this.http.put<PersonModel>(`${this.baseUrl}/${id}`, formData);
  }

  deactivatePerson(id: number): Observable<void> {
    // طبق بک‌اند، متد DELETE برای غیرفعال‌سازی استفاده می‌شود
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getPersonById(id: number): Observable<PersonModel> {
    return this.http.get<PersonModel>(`${this.baseUrl}/${id}`);
  }

  importPersonsFromExcel(file: File): Observable<ExcelImportResult> {
    const url = `${this.baseUrlExcel}/excel-import/persons`;
    // Backend returns a JSON envelope: { success, imported, message }.
    return this.http.post<ExcelImportResult>(url, buildFileFormData('file', file));
  }

  previewPersonsFromExcel(file: File): Observable<ExcelImportResult> {
    const url = `${this.baseUrlExcel}/excel-import/persons/preview`;
    return this.http.post<ExcelImportResult>(url, buildFileFormData('file', file));
  }
}
