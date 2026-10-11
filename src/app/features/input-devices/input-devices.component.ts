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
  readonly editing = signal<InputDevice | null>(null);
  readonly auditDevice = signal<InputDevice | null>(null);
  readonly auditEvents = signal<InputDeviceAuditEvent[]>([]);
  readonly selectedType = computed(() => this.types().find(type => type.key === this.draft.typeKey) ?? null);
  readonly configFields = computed<ConfigField[]>(() => Object.entries(this.selectedType()?.configSchema.properties ?? {})
    .map(([key, definition]) => ({ key, definition })));
  draft: DeviceDraft = this.blankDraft();

  ngOnInit(): void {
    this.service.types().subscribe({ next: types => { this.types.set(types); if (types.length) this.draft.typeKey = types[0].key; }, error: () => this.error.set('انواع ورودی دریافت نشد.') });
    this.load();
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
        next: (result: ProvisionedInputDevice) => { this.saving.set(false); this.notice.set('دستگاه ثبت شد. توکن فقط همین یک‌بار نمایش داده می‌شود.'); this.token.set(result.token); this.cancelEdit(); this.load(); },
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
    this.service.rotateToken(device.id).subscribe({ next: (result: ProvisionedInputDevice) => { this.token.set(result.token); this.notice.set('توکن جدید ساخته شد؛ آن را امن ذخیره کنید.'); }, error: () => this.error.set('تعویض توکن انجام نشد.') });
  }

  showAudit(device: InputDevice): void {
    this.auditDevice.set(device); this.auditEvents.set([]);
    this.service.audit(device.id).subscribe({ next: events => this.auditEvents.set(events), error: () => this.error.set('دریافت رویدادهای دستگاه انجام نشد.') });
  }

  dismissToken(): void { this.token.set(null); }
  fieldLabel(key: string): string { return ({ prefix: 'پیشوند اسکن', suffix: 'پسوند اسکن', terminator: 'پایان‌دهنده', minimumLength: 'حداقل طول بارکد', cameraFacing: 'دوربین پیش‌فرض', torchEnabled: 'چراغ‌قوه' } as Record<string, string>)[key] ?? key; }
  date(value: string | null): string { return value ? new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : 'هنوز ثبت نشده'; }
  private blankDraft(): DeviceDraft { return { name: '', typeKey: '', ownerUsername: '', station: '', config: {} }; }
}
