import { ChangeDetectionStrategy, Component, ElementRef, forwardRef, HostListener, input, signal, viewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { isValidJalaaliDate, jalaaliMonthLength, toGregorian, toJalaali, toGregorian as jalaliToGregorian } from 'jalaali-js';

const MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
const WEEKDAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
const latinDigits = (value: string): string => value.replace(/[۰-۹٠-٩]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit) >= 0 ? '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit) : '٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
const pad = (value: number): string => String(value).padStart(2, '0');
const isoDate = (year: number, month: number, day: number): string => `${year}-${pad(month)}-${pad(day)}`;

@Component({
  selector: 'app-date-input', standalone: true, imports: [MatIconModule, MatTooltipModule, OverlayModule],
  templateUrl: './date-input.component.html', styleUrl: './date-input.component.css', changeDetection: ChangeDetectionStrategy.Eager,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DateInputComponent), multi: true }],
})
export class DateInputComponent implements ControlValueAccessor {
  readonly inputId = input('appDateInput');
  readonly min = input<string | null>(null);
  readonly max = input<string | null>(null);
  readonly describedBy = input<string | null>(null);
  readonly required = input(false);
  readonly placeholder = input('تاریخ شمسی (۱۴۰۵/۰۷/۱۹)');
  readonly disabled = input(false);
  protected readonly value = signal<string | null>(null);
  protected readonly text = signal('');
  protected readonly isDisabled = signal(false);
  protected readonly open = signal(false);
  protected readonly view = signal(toJalaali(new Date()));
  protected readonly months = MONTHS;
  protected readonly weekdays = WEEKDAYS;
  protected readonly pickerPositions: ConnectedPosition[] = [
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 6 },
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -6 },
  ];
  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('dateInput');
  private onChange: (value: string | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    const next = value ?? null;
    this.value.set(next);
    this.text.set(this.toPersianText(next));
    if (next && /^\d{4}-\d{2}-\d{2}$/.test(next)) {
      const [y, m, d] = next.split('-').map(Number);
      this.view.set(toJalaali(y, m, d));
    }
  }
  registerOnChange(fn: (value: string | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void { this.isDisabled.set(disabled); }
  protected interactive(): boolean { return !this.disabled() && !this.isDisabled(); }
  protected monthTitle(): string { const { jy, jm } = this.view(); return `${MONTHS[jm - 1]} ${this.formatNumber(jy)}`; }
  protected formatNumber(value: number): string { return new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(value); }
  protected days(): { day: number | null; iso: string | null; selected: boolean; disabled: boolean }[] {
    const { jy, jm } = this.view();
    const start = toGregorian(jy, jm, 1);
    const offset = (new Date(start.gy, start.gm - 1, start.gd).getDay() + 1) % 7;
    const length = jalaaliMonthLength(jy, jm);
    const count = Math.ceil((offset + length) / 7) * 7;
    return Array.from({ length: count }, (_, index) => {
      const day = index - offset + 1;
      if (day < 1 || day > length) return { day: null, iso: null, selected: false, disabled: true };
      const g = jalaliToGregorian(jy, jm, day);
      const iso = isoDate(g.gy, g.gm, g.gd);
      return { day, iso, selected: this.value() === iso, disabled: (this.min() !== null && iso < this.min()!) || (this.max() !== null && iso > this.max()!) };
    });
  }
  protected changeMonth(delta: number): void {
    if (!this.interactive()) return;
    let { jy, jm } = this.view();
    jm += delta;
    if (jm < 1) { jy--; jm = 12; }
    if (jm > 12) { jy++; jm = 1; }
    this.view.set({ jy, jm, jd: 1 });
  }
  protected selectDay(day: { iso: string | null; disabled: boolean }): void {
    if (!day.iso || day.disabled) return;
    this.value.set(day.iso);
    this.text.set(this.toPersianText(day.iso));
    this.onChange(day.iso);
    this.open.set(false);
    this.onTouched();
    this.inputRef()?.nativeElement.focus();
  }
  protected onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value;
    this.text.set(raw);
    const match = latinDigits(raw).trim().match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
    if (!match) { this.value.set(null); this.onChange(null); return; }
    const [, ys, ms, ds] = match;
    const jy = Number(ys), jm = Number(ms), jd = Number(ds);
    if (!isValidJalaaliDate(jy, jm, jd)) { this.value.set(null); this.onChange(null); return; }
    const g = toGregorian(jy, jm, jd);
    const iso = isoDate(g.gy, g.gm, g.gd);
    this.value.set(iso);
    this.onChange(iso);
  }
  protected onBlur(): void { this.onTouched(); }
  protected togglePicker(): void {
    if (!this.interactive()) return;
    if (this.value()) {
      const [y, m, d] = this.value()!.split('-').map(Number);
      this.view.set(toJalaali(y, m, d));
    }
    this.open.update((value) => !value);
  }
  protected toPersianText(value: string | null): string {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
    const [y, m, d] = value.split('-').map(Number);
    const jalali = toJalaali(y, m, d);
    return `${this.formatNumber(jalali.jy)}/${new Intl.NumberFormat('fa-IR', { minimumIntegerDigits: 2, useGrouping: false }).format(jalali.jm)}/${new Intl.NumberFormat('fa-IR', { minimumIntegerDigits: 2, useGrouping: false }).format(jalali.jd)}`;
  }
  @HostListener('document:keydown.escape') closeOnEscape(): void { this.open.set(false); }
}
