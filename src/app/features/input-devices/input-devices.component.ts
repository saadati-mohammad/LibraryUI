import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { InputDevice, InputDeviceAuditEvent, InputConfigProperty, InputSourceType, ProvisionedInputDevice } from '../../core/model/input-device.model';
import { InputDeviceService } from '../../core/service/input-device.service';

interface ConfigField { key: string; definition: InputConfigProperty; }
interface DeviceDraft { name: string; typeKey: string; ownerUsername: string; station: string; config: Record<string, unknown>; }

@Component({
  selector: 'app-input-devices',
  imports: [FormsModule],
  templateUrl: './input-devices.component.html',
  styleUrl: './input-devices.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputDevicesComponent implements OnInit {
  private readonly service = inject(InputDeviceService);
  readonly devices = signal<InputDevice[]>([]);
  readonly types = signal<InputSourceType[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly token = signal<string | null>(null);
  readonly enrollmentQr = signal<string | null>(null);
  readonly editing = signal<InputDevice | null>(null);
  readonly auditDevice = signal<InputDevice | null>(null);
  readonly auditEvents = signal<InputDeviceAuditEvent[]>([]);
  readonly policyForms = [
    { key: 'book-registration', label: 'ثبت کتاب' },
    { key: 'loan-checkout', label: 'ثبت امانت' },
    { key: 'loan-return', label: 'بازگشت کتاب' },
    { key: 'inventory-stocktake', label: 'انبارگردانی' },
    { key: 'member-lookup', label: 'جست‌وجوی عضو' },
  ];
  readonly policyFormKey = signal('book-registration');
  readonly policyStation = signal('');
  readonly policyOwner = signal('');
  readonly policyAllowed = signal<string[]>(['MANUAL']);
  readonly policyDefault = signal('MANUAL');
  readonly policyLoading = signal(false);
  readonly policySaving = signal(false);
  readonly policyScope = signal('');
  readonly selectedType = computed(() => this.types().find(type => type.key === this.draft.typeKey) ?? null);
  readonly configFields = computed<ConfigField[]>(() => Object.entries(this.selectedType()?.configSchema.properties ?? {})
    .map(([key, definition]) => ({ key, definition })));
  draft: DeviceDraft = this.blankDraft();

  ngOnInit(): void {
    this.service.types().subscribe({ next: types => { this.types.set(types); if (types.length) this.draft.typeKey = types[0].key; }, error: () => this.error.set('انواع ورودی دریافت نشد.') });
    this.load();
    this.loadPolicy();
  }

  get policySources(): { key: string; label: string }[] {
    const providerSources = this.types().map(type => ({ key: type.key, label: type.displayName }));
    const deviceSources = this.devices().filter(device => device.enabled && !device.revoked)
      .map(device => ({ key: `DEVICE:${device.id}`, label: `${device.name} · ${device.station || 'بدون ایستگاه'}` }));
    return [...providerSources, ...deviceSources];
  }

  loadPolicy(): void {
    this.policyLoading.set(true);
    this.service.globalPolicy(this.policyFormKey(), this.policyStation().trim() || undefined,
      this.policyOwner().trim() || undefined).subscribe({
      next: policy => {
        this.policyAllowed.set(policy.allowedSources);
        this.policyDefault.set(policy.defaultSource);
        this.policyScope.set(policy.scope);
        this.policyLoading.set(false);
      },
      error: () => { this.policyLoading.set(false); this.error.set('دریافت سیاست ورودی فرم انجام نشد.'); },
    });
  }

  togglePolicySource(source: string, checked: boolean): void {
    const sources = new Set(this.policyAllowed());
    if (checked) sources.add(source); else sources.delete(source);
    if (!sources.size) sources.add('MANUAL');
    this.policyAllowed.set([...sources]);
    if (!sources.has(this.policyDefault())) this.policyDefault.set([...sources][0]);
  }

  savePolicy(): void {
    if (this.policySaving()) return;
    const allowedSources = this.policyAllowed();
    const body = { allowedSources, defaultSource: this.policyDefault(),
      station: this.policyStation().trim() || undefined, ownerUsername: this.policyOwner().trim() || undefined };
    this.policySaving.set(true);
    this.service.saveGlobalPolicy(this.policyFormKey(), body).subscribe({
      next: policy => {
        this.policyAllowed.set(policy.allowedSources); this.policyDefault.set(policy.defaultSource);
        this.policyScope.set(policy.scope); this.policySaving.set(false);
        this.notice.set('سیاست ورودی ذخیره شد.');
      },
      error: () => { this.policySaving.set(false); this.error.set('ذخیره سیاست انجام نشد؛ نوع ورودی یا دستگاه انتخابی را بررسی کنید.'); },
    });
  }

  load(): void {
    this.loading.set(true);
    this.service.list().subscribe({ next: devices => { this.devices.set(devices); this.loading.set(false); }, error: () => { this.error.set('دریافت فهرست دستگاه‌ها انجام نشد.'); this.loading.set(false); } });
  }

  onTypeChange(typeKey: string): void { this.draft = { ...this.draft, typeKey, config: {} }; }

  save(): void {
    if (this.saving() || !this.draft.name.trim() || !this.draft.typeKey) return;
    this.saving.set(true); this.error.set(null); this.notice.set(null); this.token.set(null);
    const device = this.editing();
    const body = { name: this.draft.name.trim(), ownerUsername: this.draft.ownerUsername.trim() || null,
      station: this.draft.station.trim() || null, config: this.draft.config };
    const onFailure = (failure: unknown): void => {
      this.saving.set(false);
      this.error.set(failure instanceof HttpErrorResponse && failure.status === 403 ? 'دسترسی مدیر لازم است.' : 'ذخیره انجام نشد؛ تنظیمات دستگاه را بررسی کنید.');
    };
    if (device) {
      this.service.update(device.id, body).subscribe({
        next: () => { this.saving.set(false); this.notice.set('تنظیمات دستگاه ذخیره شد.'); this.cancelEdit(); this.load(); },
        error: onFailure,
      });
    } else {
      this.service.create({ ...body, typeKey: this.draft.typeKey }).subscribe({
        next: (result: ProvisionedInputDevice) => { this.saving.set(false); this.notice.set('دستگاه ثبت شد. توکن فقط همین یک‌بار نمایش داده می‌شود.'); this.showToken(result); this.cancelEdit(); this.load(); },
        error: onFailure,
      });
    }
  }

  edit(device: InputDevice): void {
    this.editing.set(device); this.draft = { name: device.name, typeKey: device.typeKey, ownerUsername: device.ownerUsername ?? '', station: device.station ?? '', config: { ...device.config } };
    this.notice.set(null); this.error.set(null);
  }

  cancelEdit(): void {
    this.editing.set(null);
    const firstType = this.types()[0]?.key ?? '';
    this.draft = { ...this.blankDraft(), typeKey: firstType };
  }

  setConfig(key: string, value: unknown): void { this.draft = { ...this.draft, config: { ...this.draft.config, [key]: value } }; }
  configValue(key: string, field: InputConfigProperty): unknown {
    const value = this.draft.config[key];
    if (value !== undefined) return value;
    return field.type === 'boolean' ? false : field.enum?.[0] ?? '';
  }

  toggle(device: InputDevice): void {
    const request = device.enabled ? this.service.disable(device.id) : this.service.enable(device.id);
    request.subscribe({ next: () => { this.notice.set(device.enabled ? 'دستگاه غیرفعال شد.' : 'دستگاه فعال شد.'); this.load(); }, error: () => this.error.set('تغییر وضعیت دستگاه انجام نشد.') });
  }

  revoke(device: InputDevice): void {
    if (!window.confirm(`دسترسی دستگاه «${device.name}» برای همیشه لغو شود؟`)) return;
    this.service.revoke(device.id).subscribe({ next: () => { this.notice.set('دستگاه لغو شد؛ سابقهٔ آن حفظ شده است.'); this.load(); }, error: () => this.error.set('لغو دستگاه انجام نشد.') });
  }

  rotateToken(device: InputDevice): void {
    if (!window.confirm(`توکن «${device.name}» عوض شود؟ توکن قبلی فوراً از اعتبار می‌افتد.`)) return;
    this.service.rotateToken(device.id).subscribe({ next: (result: ProvisionedInputDevice) => { this.showToken(result); this.notice.set('توکن جدید ساخته شد؛ گوشی قبلی فوراً از اعتبار می‌افتد. QR را با گوشی دوباره اسکن کنید.'); }, error: () => this.error.set('تعویض توکن انجام نشد.') });
  }

  showAudit(device: InputDevice): void {
    this.auditDevice.set(device); this.auditEvents.set([]);
    this.service.audit(device.id).subscribe({ next: events => this.auditEvents.set(events), error: () => this.error.set('دریافت رویدادهای دستگاه انجام نشد.') });
  }

  dismissToken(): void { this.token.set(null); this.enrollmentQr.set(null); }
  private async showToken(result: ProvisionedInputDevice): Promise<void> {
    this.token.set(result.token);
    this.enrollmentQr.set(null);
    if (result.device.typeKey !== 'PHONE_CAMERA') return;
    try {
      const QRCode = await import('qrcode');
      const enrollmentUrl = `${window.location.origin}/phone-scan#device=${result.device.id}.${result.token}`;
      this.enrollmentQr.set(await QRCode.toDataURL(enrollmentUrl, { width: 220, margin: 1, errorCorrectionLevel: 'M' }));
    } catch { this.error.set('ساخت QR انجام نشد؛ پیوند ثبت گوشی در دسترس نیست.'); }
  }
  fieldLabel(key: string): string { return ({ prefix: 'پیشوند اسکن', suffix: 'پسوند اسکن', terminator: 'پایان‌دهنده', minimumLength: 'حداقل طول بارکد', cameraFacing: 'دوربین پیش‌فرض', torchEnabled: 'چراغ‌قوه' } as Record<string, string>)[key] ?? key; }
  date(value: string | null): string { return value ? new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : 'هنوز ثبت نشده'; }
  private blankDraft(): DeviceDraft { return { name: '', typeKey: '', ownerUsername: '', station: '', config: {} }; }
}
