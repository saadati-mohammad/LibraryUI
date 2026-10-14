import { Directive, EventEmitter, HostListener, Input, OnDestroy, Output } from '@angular/core';
import type { InputDeviceRuntimeProfile } from '../../core/model/input-device.model';

const MAX_SCANNER_KEY_GAP_MS = 45;
const NO_TERMINATOR_IDLE_MS = 120;

/** Decodes a configured HID keyboard-wedge stream while preserving ordinary manual Enter behavior. */
@Directive({
  selector: 'input[appKeyboardWedgeScanner]',
  standalone: true,
})
export class KeyboardWedgeScannerDirective implements OnDestroy {
  @Input() appKeyboardWedgeScanner: InputDeviceRuntimeProfile | null = null;
  @Output() scanDetected = new EventEmitter<string>();
  @Output() scanRejected = new EventEmitter<string>();
  @Output() enterPressed = new EventEmitter<void>();

  private previousKeyAt: number | null = null;
  private burstLength = 0;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private activeInput: HTMLInputElement | null = null;

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const profile = this.appKeyboardWedgeScanner;
    if (!profile || event.ctrlKey || event.altKey || event.metaKey) {
      if (event.key === 'Enter') this.enterPressed.emit();
      return;
    }

    if (event.key === 'Enter' || event.key === 'Tab') {
      const configuredTerminator = String(profile.config['terminator'] ?? 'ENTER');
      const expectedTerminator = event.key === 'Enter' ? 'ENTER' : 'TAB';
      if (configuredTerminator === expectedTerminator && this.isFastEnough(profile)) {
        event.preventDefault();
        event.stopPropagation();
        this.finishScan(event.currentTarget as HTMLInputElement, profile);
      } else if (event.key === 'Enter') {
        this.resetBurst();
        this.enterPressed.emit();
      }
      return;
    }

    if (event.key.length !== 1) return;
    this.activeInput = event.currentTarget as HTMLInputElement;
    const now = performance.now();
    if (this.previousKeyAt === null || now - this.previousKeyAt > MAX_SCANNER_KEY_GAP_MS) this.burstLength = 0;
    this.burstLength++;
    this.previousKeyAt = now;

    if (String(profile.config['terminator'] ?? 'ENTER') === 'NONE' && this.isFastEnough(profile)) {
      if (this.idleTimer) clearTimeout(this.idleTimer);
      this.idleTimer = setTimeout(() => {
        this.idleTimer = null;
        if (this.activeInput) this.finishScan(this.activeInput, profile);
      }, NO_TERMINATOR_IDLE_MS);
    }
  }

  ngOnDestroy(): void { this.resetBurst(); }

  private isFastEnough(profile: InputDeviceRuntimeProfile): boolean {
    const minimumLength = Number(profile.config['minimumLength'] ?? 1);
    return Number.isFinite(minimumLength) && this.burstLength >= Math.max(1, minimumLength);
  }

  private finishScan(input: HTMLInputElement, profile: InputDeviceRuntimeProfile): void {
    const raw = input.value;
    const prefix = String(profile.config['prefix'] ?? '');
    const suffix = String(profile.config['suffix'] ?? '');
    if ((prefix && !raw.startsWith(prefix)) || (suffix && !raw.endsWith(suffix))) {
      this.scanRejected.emit('پیشوند یا پسوند ورودی با تنظیم اسکنر هم‌خوانی ندارد.');
      this.resetBurst();
      return;
    }
    const start = prefix.length;
    const end = suffix.length ? raw.length - suffix.length : raw.length;
    const value = raw.slice(start, end);
    const minimumLength = Number(profile.config['minimumLength'] ?? 1);
    if (value.length < minimumLength) {
      this.scanRejected.emit('بارکد دریافتی از حداقل طول تنظیم‌شده کوتاه‌تر است.');
      this.resetBurst();
      return;
    }
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    this.scanDetected.emit(value);
    this.resetBurst();
  }

  private resetBurst(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = null;
    this.previousKeyAt = null;
    this.burstLength = 0;
    this.activeInput = null;
  }
}
