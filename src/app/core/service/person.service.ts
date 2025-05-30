import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PersonService {
  private baseUrl = `${environment.apiUrl}/`;
  constructor(private http: HttpClient) { }
  getPersonList (): Observable<any> {
    // این متد برای دریافت لیست اشخاص از سرور استفاده می‌شود
    return this.http.get(this.baseUrl + 'person',{});
  }
  getPersonById(personId: number): Observable<any> {
    // این متد برای دریافت اطلاعات یک شخص بر اساس شناسه آن استفاده می‌شود
    return this.http.get(`${this.baseUrl}person/${personId}`);
  }
  addPerson(personData: any): Observable<any> {
    // این متد برای ارسال اطلاعات شخص جدید به سرور استفاده می‌شود
    return this.http.post(this.baseUrl + 'person', personData);
  }
  updatePerson(personId: number, personData: any): Observable<any> {
    // این متد برای به‌روزرسانی اطلاعات یک شخص بر اساس شناسه آن استفاده می‌شود
    return this.http.put(`${this.baseUrl}person/${personId}`, personData);
  }
  deletePerson(personId: number): Observable<any> {
    // این متد برای حذف یک شخص بر اساس شناسه آن استفاده می‌شود
    return this.http.delete(`${this.baseUrl}person/${personId}`);
  }

}
