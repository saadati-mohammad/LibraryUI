import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface PhoneScannerSession {
  sessionId: string;
  pairingToken: string;
  expiresAt: string;
}

export interface ScannedBarcode {
  sequence: number;
  barcode: string;
  receivedAt: string;
}

@Injectable({ providedIn: 'root' })
export class PhoneBarcodeRelayService {
  private readonly http = inject(HttpClient);
  private readonly staffUrl = `${environment.apiUrl}/book/scanner-sessions`;
  private readonly phoneUrl = `${environment.apiUrl}/phone-scanner/sessions`;

  createSession(): Observable<PhoneScannerSession> {
    return this.http.post<PhoneScannerSession>(this.staffUrl, {});
  }

  poll(sessionId: string, afterSequence: number): Observable<ScannedBarcode[]> {
    return this.http.get<ScannedBarcode[]>(`${this.staffUrl}/${encodeURIComponent(sessionId)}/scans`, {
      params: { afterSequence },
    });
  }

  submitFromPhone(sessionId: string, pairingToken: string, barcode: string): Observable<ScannedBarcode> {
    return this.http.post<ScannedBarcode>(`${this.phoneUrl}/${encodeURIComponent(sessionId)}/scans`, {
      pairingToken,
      barcode,
    });
  }

  closeSession(sessionId: string): Observable<void> {
    return this.http.delete<void>(`${this.staffUrl}/${encodeURIComponent(sessionId)}`);
  }
}
