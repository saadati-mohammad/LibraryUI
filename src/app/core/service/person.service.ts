import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PersonFilterModel, PersonModel } from '../model/personModel';

// اینترفیس PaginatedResponse را می‌توان در یک فایل مشترک قرار داد
export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class PersonService {
  readonly baseUrl: string = `${environment.apiUrl}/person`;
  readonly baseUrlExcel: string = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  getPersonList(
    filters?: Partial<PersonFilterModel>,
    page: number = 0,
    size: number = 10,
    sort: string = 'id,desc'
  ): Observable<PaginatedResponse<PersonModel>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== null && value !== undefined && value !== '') {
          params = params.append(key, value);
        }
      });
    }
    return this.http.get<PaginatedResponse<PersonModel>>(this.baseUrl, { params });
  }

  addPerson(personData: PersonModel, profilePicture?: File): Observable<PersonModel> {
    const formData = new FormData();
    formData.append('person', new Blob([JSON.stringify(personData)], { type: 'application/json' }));
    if (profilePicture) {
      formData.append('profilePicture', profilePicture, profilePicture.name);
    }
    return this.http.post<PersonModel>(this.baseUrl, formData);
  }

  updatePerson(id: number, personData: PersonModel, profilePicture?: File | null): Observable<PersonModel> {
    const formData = new FormData();

    if (profilePicture === null) {
      const personDataWithoutPicture = { ...personData, profilePicture: null };
      formData.append('person', new Blob([JSON.stringify(personDataWithoutPicture)], { type: 'application/json' }));
    } else {
      formData.append('person', new Blob([JSON.stringify(personData)], { type: 'application/json' }));
    }

    if (profilePicture instanceof File) {
      formData.append('profilePicture', profilePicture, profilePicture.name);
    }

    return this.http.put<PersonModel>(`${this.baseUrl}/${id}`, formData);
  }

  deactivatePerson(id: number): Observable<void> {
    // طبق بک‌اند، متد DELETE برای غیرفعال‌سازی استفاده می‌شود
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getPersonById(id: number): Observable<PersonModel> {
    return this.http.get<PersonModel>(`${this.baseUrl}/${id}`);
  }

  importPersonsFromExcel(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    const url = `${this.baseUrlExcel}/excel-import/persons`;
    return this.http.post(url, formData, {
      responseType: 'text'
    });
  }
}
