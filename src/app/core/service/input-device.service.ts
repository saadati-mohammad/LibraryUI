import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { InputDevice, InputDeviceAuditEvent, InputFormPolicy, InputSourceType, ProvisionedInputDevice, SaveInputFormPolicy } from '../model/input-device.model';

@Injectable({ providedIn: 'root' })
export class InputDeviceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/input-devices`;
  private readonly policyUrl = `${environment.apiUrl}/admin/input-policies`;

  types(): Observable<InputSourceType[]> { return this.http.get<InputSourceType[]>(`${this.baseUrl}/types`); }
  list(): Observable<InputDevice[]> { return this.http.get<InputDevice[]>(this.baseUrl); }
  create(body: Pick<InputDevice, 'name' | 'typeKey' | 'ownerUsername' | 'station' | 'config'>): Observable<ProvisionedInputDevice> {
    return this.http.post<ProvisionedInputDevice>(this.baseUrl, body);
  }
  update(id: number, body: Pick<InputDevice, 'name' | 'ownerUsername' | 'station' | 'config'>): Observable<InputDevice> {
    return this.http.put<InputDevice>(`${this.baseUrl}/${id}`, body);
  }
  enable(id: number): Observable<InputDevice> { return this.http.post<InputDevice>(`${this.baseUrl}/${id}/enable`, {}); }
  disable(id: number): Observable<InputDevice> { return this.http.post<InputDevice>(`${this.baseUrl}/${id}/disable`, {}); }
  revoke(id: number): Observable<InputDevice> { return this.http.delete<InputDevice>(`${this.baseUrl}/${id}`); }
  rotateToken(id: number): Observable<ProvisionedInputDevice> { return this.http.post<ProvisionedInputDevice>(`${this.baseUrl}/${id}/rotate-token`, {}); }
  audit(id: number): Observable<InputDeviceAuditEvent[]> { return this.http.get<InputDeviceAuditEvent[]>(`${this.baseUrl}/${id}/audit`); }
  effectivePolicy(formKey: string, station?: string): Observable<InputFormPolicy> {
    const params: Record<string, string> = {};
    if (station) params['station'] = station;
    return this.http.get<InputFormPolicy>(`${environment.apiUrl}/input-policies/${encodeURIComponent(formKey)}`, { params });
  }
  globalPolicy(formKey: string, station?: string, ownerUsername?: string): Observable<InputFormPolicy> {
    const params: Record<string, string> = {};
    if (station) params['station'] = station;
    if (ownerUsername) params['ownerUsername'] = ownerUsername;
    return this.http.get<InputFormPolicy>(`${this.policyUrl}/${encodeURIComponent(formKey)}`, { params });
  }
  saveGlobalPolicy(formKey: string, body: SaveInputFormPolicy): Observable<InputFormPolicy> {
    return this.http.put<InputFormPolicy>(`${this.policyUrl}/${encodeURIComponent(formKey)}`, body);
  }
}
