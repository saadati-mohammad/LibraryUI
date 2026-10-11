import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, OnInit, PLATFORM_ID, ViewChild, inject } from '@angular/core';
import { PhoneBarcodeRelayService } from '../../core/service/phone-barcode-relay.service';
import { isValidIsbn, normalizeIsbn } from '../../core/util/isbn.util';
import type { IScannerControls } from '@zxing/browser';
import type { DecodeHintType as DecodeHintKey } from '@zxing/library';

@Component({
  selector: 'app-phone-scanner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="phone-page" dir="rtl" lang="fa">
      <section class="scanner-card" aria-labelledby="scannerTitle">
        <header class="brand"><span class="brand-mark" aria-hidden="true">▤</span><span>کتابخانه</span></header>
        <h1 id="scannerTitle">اسکنر همراه کتابخانه</h1>
        @if (!sessionId || !pairingToken) {
          <div class="notice" role="status">
            برای اتصال، از صفحهٔ افزودن کتاب در رایانه گزینهٔ «اتصال اسکنر گوشی» را بزنید و QR را با این گوشی اسکن کنید.
          </div>
          <p class="muted">این صفحه را می‌توانید به صفحهٔ اصلی گوشی اضافه کنید؛ برای هر نوبت اسکن، اتصال تازه‌ای از رایانه بسازید.</p>
        } @else {
          <p class="connected" role="status">گوشی به فرم کتاب در رایانه وصل است. بارکد ISBN را اسکن کنید.</p>
          <div class="camera-frame" [hidden]="!cameraActive">
            <video #video autoplay muted playsinline aria-label="نمای زندهٔ دوربین گوشی"></video>
          </div>
          <div class="actions">
            @if (!cameraActive) {
              <button type="button" class="primary" (click)="startCamera()" [disabled]="cameraStarting">
                {{cameraStarting ? 'در حال آماده‌سازی دوربین…' : 'شروع اسکن با دوربین'}}
              </button>
            } @else {
              <button type="button" class="secondary" (click)="stopCamera()">توقف دوربین</button>
            }
          </div>
          <label for="phoneBarcode">یا از اسکنر بلوتوثی/USB متصل به گوشی یا صفحه‌کلید استفاده کنید</label>
          <div class="manual-row">
            <input #barcodeInput id="phoneBarcode" type="text" inputmode="numeric" autocomplete="off"
              [value]="barcodeValue" (input)="barcodeValue = $any($event.target).value"
              (keydown.enter)="$event.preventDefault(); submitBarcode()" placeholder="ISBN و سپس Enter" />
            <button type="button" class="primary" (click)="submitBarcode()" [disabled]="sending">ارسال</button>
          </div>
          <p class="status" aria-live="polite" role="status">{{statusMessage}}</p>
        }
      </section>
      <p class="footer">اتصال رمزدار و موقت · اطلاعات کتاب فقط در فرم رایانه نمایش داده می‌شود</p>
    </main>
  `,
  styleUrl: './phone-scanner.component.css',
})
export class PhoneScannerComponent implements OnInit, OnDestroy {
  @ViewChild('video') private video?: ElementRef<HTMLVideoElement>;
  @ViewChild('barcodeInput') private barcodeInput?: ElementRef<HTMLInputElement>;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly zone = inject(NgZone);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly relay = inject(PhoneBarcodeRelayService);
  private scannerControls: IScannerControls | null = null;
  private lastSubmitted = '';
  private lastSubmittedAt = 0;
  sessionId = '';
  pairingToken = '';
  barcodeValue = '';
  statusMessage = 'دوربین را روشن کنید یا بارکدخوان را به‌صورت صفحه‌کلید وصل کنید.';
  cameraStarting = false;
  cameraActive = false;
  sending = false;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const pair = new URLSearchParams(window.location.hash.slice(1)).get('pair');
    const [sessionId, pairingToken] = pair?.split('.', 2) ?? [];
    if (sessionId && pairingToken && /^[0-9a-f-]{36}$/i.test(sessionId) && pairingToken.length >= 40) {
      this.sessionId = sessionId;
      this.pairingToken = pairingToken;
    }
  }

  ngOnDestroy(): void { this.stopCamera(); }

  async startCamera(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || this.cameraStarting || this.cameraActive) return;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      this.statusMessage = 'برای دوربین گوشی، برنامه باید از طریق HTTPS باز شود. اسکنر متصل و ورود دستی همچنان کار می‌کنند.';
      return;
    }
    this.cameraStarting = true;
    try {
      const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
        import('@zxing/browser'), import('@zxing/library'),
      ]);
      const hints = new Map<DecodeHintKey, unknown>();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.UPC_A, BarcodeFormat.CODE_128]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      const reader = new BrowserMultiFormatReader(hints);
      this.scannerControls = await reader.decodeFromConstraints(
        { audio: false, video: { facingMode: { ideal: 'environment' } } },
        this.video?.nativeElement ?? (() => { throw new Error('Camera preview is unavailable'); })(),
        result => { if (result) this.submitBarcode(result.getText()); },
      );
      this.cameraActive = true;
      this.statusMessage = 'دوربین فعال است؛ بارکد را در کادر نگه دارید.';
    } catch {
      this.scannerControls?.stop();
      this.scannerControls = null;
      this.cameraActive = false;
      this.statusMessage = 'دوربین در دسترس نیست یا مجوز آن داده نشد؛ از اسکنر متصل یا ورود دستی استفاده کنید.';
    } finally {
      this.cameraStarting = false;
    }
  }

  stopCamera(): void {
    this.scannerControls?.stop();
    this.scannerControls = null;
    this.cameraActive = false;
  }

  submitBarcode(rawValue = this.barcodeValue): void {
    const barcode = normalizeIsbn(rawValue);
    if (!isValidIsbn(barcode)) {
      this.statusMessage = 'بارکد ISBN معتبر نیست؛ بارکد کتاب را دوباره بخوانید.';
      return;
    }
    const now = Date.now();
    if (barcode === this.lastSubmitted && now - this.lastSubmittedAt < 1_200) return;
    if (this.sending) return;
    this.sending = true;
    this.barcodeValue = '';
    this.relay.submitFromPhone(this.sessionId, this.pairingToken, barcode).subscribe({
      next: scan => this.zone.run(() => {
          this.lastSubmitted = barcode;
          this.lastSubmittedAt = Date.now();
          this.statusMessage = `بارکد ${scan.barcode} به رایانه ارسال شد.`;
          this.sending = false;
          try { navigator.vibrate?.(45); } catch { /* Haptics are optional on unsupported devices. */ }
          this.changeDetector.detectChanges();
          setTimeout(() => this.barcodeInput?.nativeElement.focus(), 0);
        }),
      error: (error: { status?: number }) => this.zone.run(() => {
          this.statusMessage = error.status === 410
            ? 'اتصال منقضی شده؛ QR تازه‌ای از رایانه اسکن کنید.'
            : 'ارسال انجام نشد؛ اتصال شبکه را بررسی کنید و دوباره اسکن کنید.';
          this.sending = false;
          this.changeDetector.detectChanges();
        }),
    });
  }
}
