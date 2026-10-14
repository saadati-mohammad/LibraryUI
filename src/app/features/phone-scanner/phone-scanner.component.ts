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
          @if (cameraActive && cameraDevices.length > 1) {
            <label class="camera-select" for="phoneCameraSelect">انتخاب دوربین
              <select id="phoneCameraSelect" [value]="selectedCameraId" (change)="selectCamera($any($event.target).value)">
                @for (camera of cameraDevices; track camera.deviceId) { <option [value]="camera.deviceId">{{camera.label || 'دوربین ' + ($index + 1)}}</option> }
              </select>
            </label>
          }
          @if (cameraActive && torchSupported) {
            <button type="button" class="secondary" [attr.aria-pressed]="torchEnabled" (click)="toggleTorch()">
              {{torchEnabled ? 'خاموش‌کردن چراغ‌قوه' : 'روشن‌کردن چراغ‌قوه'}}
            </button>
          }
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
            <button type="button" class="primary" (click)="submitBarcode()" [disabled]="sending">
              {{sending ? 'در حال ارسال…' : pendingBarcodes.length ? 'ارسال دوبارهٔ صف (' + pendingBarcodes.length + ')' : 'ارسال'}}
            </button>
          </div>
          @if (pendingBarcodes.length) { <p class="status" role="status">{{pendingBarcodes.length}} بارکد در صف ارسال است.</p> }
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
  cameraDevices: MediaDeviceInfo[] = [];
  selectedCameraId = '';
  torchSupported = false;
  torchEnabled = false;
  sending = false;
  readonly pendingBarcodes: string[] = [];
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
      this.restoreRegisteredQueue();
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
      const videoConstraints: MediaTrackConstraints = this.selectedCameraId
        ? { deviceId: { exact: this.selectedCameraId } }
        : { facingMode: { ideal: 'environment' } };
      this.scannerControls = await reader.decodeFromConstraints(
        { audio: false, video: videoConstraints },
        this.video?.nativeElement ?? (() => { throw new Error('Camera preview is unavailable'); })(),
        // Keep camera mode hands-free without opening the phone's soft keyboard after each scan.
        result => { if (result) this.submitBarcode(result.getText(), false); },
      );
      this.cameraActive = true;
      const [devices, stream] = await Promise.all([
        BrowserMultiFormatReader.listVideoInputDevices().catch(() => []),
        Promise.resolve(this.video?.nativeElement.srcObject instanceof MediaStream
          ? this.video.nativeElement.srcObject.getVideoTracks()[0] : undefined),
      ]);
      this.cameraDevices = devices;
      this.selectedCameraId = stream?.getSettings().deviceId ?? this.selectedCameraId;
      this.torchSupported = typeof this.scannerControls?.switchTorch === 'function';
      this.torchEnabled = false;
      this.statusMessage = 'دوربین فعال است؛ بارکد را در کادر نگه دارید.';
      this.changeDetector.detectChanges();
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
    this.torchEnabled = false;
  }

  async selectCamera(deviceId: string): Promise<void> {
    if (!deviceId || deviceId === this.selectedCameraId) return;
    this.selectedCameraId = deviceId;
    this.stopCamera();
    await this.startCamera();
  }

  async toggleTorch(): Promise<void> {
    if (!this.scannerControls?.switchTorch) {
      this.statusMessage = 'چراغ‌قوه توسط این دوربین یا مرورگر پشتیبانی نمی‌شود.';
      return;
    }
    try {
      await this.scannerControls.switchTorch(!this.torchEnabled);
      this.torchEnabled = !this.torchEnabled;
    } catch {
      this.torchSupported = false;
      this.torchEnabled = false;
      this.statusMessage = 'کنترل چراغ‌قوه در این دستگاه در دسترس نیست.';
    }
    this.changeDetector.detectChanges();
  }

  forgetRegisteredDevice(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try { localStorage.removeItem('library.phone-scanner.device'); } catch { /* Storage may be disabled by browser policy. */ }
    this.clearRegisteredQueue();
    this.registeredDeviceId = null;
    this.registeredDeviceToken = '';
    this.statusMessage = 'ثبت این گوشی از این مرورگر پاک شد؛ برای ثبت دوباره QR مدیر را اسکن کنید.';
  }

  submitBarcode(rawValue = this.barcodeValue, refocusInput = true): void {
    if (!rawValue.trim() && this.pendingBarcodes.length > 0) {
      this.sendBarcode(this.pendingBarcodes[0], refocusInput, true);
      return;
    }
    const barcode = normalizeIsbn(rawValue);
    if (!isValidIsbn(barcode)) {
      this.statusMessage = 'بارکد ISBN معتبر نیست؛ بارکد کتاب را دوباره بخوانید.';
      return;
    }
    const now = Date.now();
    if (barcode === this.lastSubmitted && now - this.lastSubmittedAt < 1_200) return;
    if (this.sending) {
      if (this.pendingBarcodes.length >= 50) {
        this.statusMessage = 'صف اسکن پر است؛ پس از پایان ارسال دوباره اسکن کنید.';
        return;
      }
      this.pendingBarcodes.push(barcode);
      this.persistRegisteredQueue();
      this.barcodeValue = '';
      this.statusMessage = `${this.pendingBarcodes.length} بارکد در صف ارسال است.`;
      this.changeDetector.detectChanges();
      return;
    }
    this.sendBarcode(barcode, refocusInput);
  }

  private sendBarcode(barcode: string, refocusInput: boolean, retry = false): void {
    const now = Date.now();
    if (!retry && barcode === this.lastSubmitted && now - this.lastSubmittedAt < 1_200) return;
    this.sending = true;
    this.barcodeValue = '';
    this.lastSubmitted = barcode;
    this.lastSubmittedAt = now;
    const submission = this.registeredDeviceId !== null
      ? this.relay.submitRegisteredFromPhone(this.sessionId, this.pairingToken, barcode, this.registeredDeviceId, this.registeredDeviceToken)
      : this.relay.submitFromPhone(this.sessionId, this.pairingToken, barcode);
    submission.subscribe({
      next: scan => this.zone.run(() => {
          if (retry && this.pendingBarcodes[0] === barcode) this.pendingBarcodes.shift();
          else if (retry) {
            const queuedIndex = this.pendingBarcodes.indexOf(barcode);
            if (queuedIndex >= 0) this.pendingBarcodes.splice(queuedIndex, 1);
          }
          this.persistRegisteredQueue();
          this.lastSubmittedAt = Date.now();
          this.statusMessage = `بارکد ${scan.barcode} به رایانه ارسال شد.`;
          this.sending = false;
          try { navigator.vibrate?.(45); } catch { /* Haptics are optional on unsupported devices. */ }
          this.changeDetector.detectChanges();
          if (refocusInput) setTimeout(() => this.barcodeInput?.nativeElement.focus(), 0);
          if (this.pendingBarcodes.length) setTimeout(() => this.submitBarcode('', false), 0);
        }),
      error: (error: { status?: number }) => this.zone.run(() => {
          if (!this.pendingBarcodes.includes(barcode)) this.pendingBarcodes.unshift(barcode);
          this.persistRegisteredQueue();
          if (error.status === 401) {
            this.registeredDeviceId = null;
            this.registeredDeviceToken = '';
            localStorage.removeItem('library.phone-scanner.device');
          }
          this.statusMessage = error.status === 410
            ? 'اتصال منقضی شده؛ QR تازه‌ای از رایانه اسکن کنید.'
            : error.status === 401 ? 'دسترسی اسکنر لغو شده است؛ از مدیر بخواهید گوشی را دوباره ثبت کند.'
            : `ارسال انجام نشد؛ ${this.pendingBarcodes.length} بارکد در صف حفظ شد. اتصال را بررسی و ارسال دوباره را بزنید.`;
          this.sending = false;
          this.changeDetector.detectChanges();
        }),
    });
  }

  private restoreRegisteredQueue(): void {
    if (this.registeredDeviceId === null || this.pendingBarcodes.length) return;
    try {
      const saved = JSON.parse(localStorage.getItem(this.queueStorageKey()) ?? '[]') as unknown;
      if (Array.isArray(saved)) {
        this.pendingBarcodes.push(...saved
          .filter((value): value is string => typeof value === 'string' && isValidIsbn(value))
          .map(normalizeIsbn)
          .filter((value, index, all) => all.indexOf(value) === index)
          .slice(0, 50));
      }
    } catch { /* Storage can be disabled or contain invalid JSON; scanning stays available. */ }
  }

  private persistRegisteredQueue(): void {
    if (this.registeredDeviceId === null) return;
    try { localStorage.setItem(this.queueStorageKey(), JSON.stringify(this.pendingBarcodes)); }
    catch { /* Storage quota/policy must not prevent the current scan session. */ }
  }

  private clearRegisteredQueue(): void {
    if (this.registeredDeviceId === null) return;
    try { localStorage.removeItem(this.queueStorageKey()); }
    catch { /* Storage may be disabled by browser policy. */ }
    this.pendingBarcodes.splice(0);
  }

  private queueStorageKey(): string {
    return `library.phone-scanner.queue.${this.registeredDeviceId}`;
  }
}
