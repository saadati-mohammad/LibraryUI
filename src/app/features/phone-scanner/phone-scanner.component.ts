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
          <p class="status" aria-live="polite">{{statusMessage}}</p>
          @if (registeredDeviceId !== null) { <button type="button" class="secondary" (click)="forgetRegisteredDevice()">فراموش‌کردن ثبت این گوشی</button> }
          <p class="muted">این صفحه را می‌توانید به صفحهٔ اصلی گوشی اضافه کنید؛ برای هر نوبت اسکن، اتصال تازه‌ای از رایانه بسازید.</p>
        } @else {
          <p class="connected" role="status">{{registeredDeviceId !== null ? 'گوشی ثبت‌شده و مجاز' : 'گوشی موقت'}} به فرم کتاب در رایانه وصل است. بارکد ISBN را اسکن کنید.</p>
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
  registeredDeviceId: number | null = null;
  registeredDeviceToken = '';
  barcodeValue = '';
  statusMessage = 'دوربین را روشن کنید یا بارکدخوان را به‌صورت صفحه‌کلید وصل کنید.';
  cameraStarting = false;
  cameraActive = false;
  sending = false;
  private readonly handleHashChange = (): void => this.readPairFromHash();

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    window.addEventListener('hashchange', this.handleHashChange);
    const device = new URLSearchParams(window.location.hash.slice(1)).get('device');
    const [deviceId, deviceToken] = device?.split('.', 2) ?? [];
    if (deviceId && /^\d+$/.test(deviceId) && deviceToken && deviceToken.length >= 40) {
      try {
        localStorage.setItem('library.phone-scanner.device', JSON.stringify({ id: Number(deviceId), token: deviceToken }));
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
        this.statusMessage = 'این گوشی به‌عنوان اسکنر ثبت شد. حالا QR اتصال موقت را از رایانه اسکن کنید.';
      } catch { this.statusMessage = 'ذخیره امن دستگاه در این مرورگر ممکن نیست؛ از اتصال موقت استفاده کنید.'; }
    }
    try {
      const saved = JSON.parse(localStorage.getItem('library.phone-scanner.device') ?? 'null') as { id?: number; token?: string } | null;
      if (saved && Number.isSafeInteger(saved.id) && typeof saved.token === 'string') {
        this.registeredDeviceId = saved.id!;
        this.registeredDeviceToken = saved.token;
      }
    } catch { /* Storage may be disabled by the browser; ephemeral QR pairing still works. */ }
    this.readPairFromHash();
  }

  private readPairFromHash(): void {
    const pair = new URLSearchParams(window.location.hash.slice(1)).get('pair');
    const [sessionId, pairingToken] = pair?.split('.', 2) ?? [];
    if (sessionId && pairingToken && /^[0-9a-f-]{36}$/i.test(sessionId) && pairingToken.length >= 40) {
      this.sessionId = sessionId;
      this.pairingToken = pairingToken;
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
      this.changeDetector.detectChanges();
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) window.removeEventListener('hashchange', this.handleHashChange);
    this.stopCamera();
  }

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
        // Keep camera mode hands-free without opening the phone's soft keyboard after each scan.
        result => { if (result) this.submitBarcode(result.getText(), false); },
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

  forgetRegisteredDevice(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try { localStorage.removeItem('library.phone-scanner.device'); } catch { /* Storage may be disabled by browser policy. */ }
    this.registeredDeviceId = null;
    this.registeredDeviceToken = '';
    this.statusMessage = 'ثبت این گوشی از این مرورگر پاک شد؛ برای ثبت دوباره QR مدیر را اسکن کنید.';
  }

  submitBarcode(rawValue = this.barcodeValue, refocusInput = true): void {
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
    const submission = this.registeredDeviceId !== null
      ? this.relay.submitRegisteredFromPhone(this.sessionId, this.pairingToken, barcode, this.registeredDeviceId, this.registeredDeviceToken)
      : this.relay.submitFromPhone(this.sessionId, this.pairingToken, barcode);
    submission.subscribe({
      next: scan => this.zone.run(() => {
          this.lastSubmitted = barcode;
          this.lastSubmittedAt = Date.now();
          this.statusMessage = `بارکد ${scan.barcode} به رایانه ارسال شد.`;
          this.sending = false;
          try { navigator.vibrate?.(45); } catch { /* Haptics are optional on unsupported devices. */ }
          this.changeDetector.detectChanges();
          if (refocusInput) setTimeout(() => this.barcodeInput?.nativeElement.focus(), 0);
        }),
      error: (error: { status?: number }) => this.zone.run(() => {
          if (error.status === 401) {
            this.registeredDeviceId = null;
            this.registeredDeviceToken = '';
            localStorage.removeItem('library.phone-scanner.device');
          }
          this.statusMessage = error.status === 410
            ? 'اتصال منقضی شده؛ QR تازه‌ای از رایانه اسکن کنید.'
            : error.status === 401 ? 'دسترسی اسکنر لغو شده است؛ از مدیر بخواهید گوشی را دوباره ثبت کند.'
            : 'ارسال انجام نشد؛ اتصال شبکه را بررسی کنید و دوباره اسکن کنید.';
          this.sending = false;
          this.changeDetector.detectChanges();
        }),
    });
  }
}
