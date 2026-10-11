import {
  Component,
  ElementRef,
  forwardRef,
  input,
  signal,
  viewChild,
  ChangeDetectionStrategy
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * `<input type="date">` wrapper with a native-calendar trigger button.
 *
 * Why a wrapper at all: the ISO value the input exposes is exactly what the backend
 * binds to `LocalDate`, but Safari/WebKit renders no calendar affordance and Firefox's
 * is hidden behind a click on a small glyph. The wrapper keeps the native control (so
 * the platform picker, keyboard entry and `min`/`max` validation all still work) and
 * adds an explicit, labelled button plus Material-consistent styling.
 *
 * It is a `ControlValueAccessor` over the *string* value (`yyyy-MM-dd` or `null`), so
 * `formControlName` binds to the ISO string the API expects — no conversion layer.
 */
@Component({
  selector: 'app-date-input',
  standalone: true,
  imports: [MatIconModule, MatTooltipModule],
  templateUrl: './date-input.component.html',
  styleUrl: './date-input.component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateInputComponent),
      multi: true,
    },
  ],
})
export class DateInputComponent implements ControlValueAccessor {
  readonly inputId = input<string>('appDateInput');
  /** ISO `yyyy-MM-dd` lower bound (inclusive). */
  readonly min = input<string | null>(null);
  /** ISO `yyyy-MM-dd` upper bound (inclusive). */
  readonly max = input<string | null>(null);
  readonly describedBy = input<string | null>(null);
  readonly required = input(false);
  readonly placeholder = input<string>('YYYY-MM-DD');
  readonly disabled = input(false);

  protected readonly value = signal<string | null>(null);
  protected readonly isDisabled = signal(false);

  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('dateInput');

  private onChange: (value: string | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  protected interactive(): boolean {
    return !this.disabled() && !this.isDisabled();
  }

  protected onInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const next = raw.length > 0 ? raw : null;
    this.value.set(next);
    this.onChange(next);
  }

  protected onBlur(): void {
    this.onTouched();
  }

  /** Opens the platform calendar. `showPicker()` is Chromium-only, hence the try/catch. */
  protected openPicker(): void {
    const input = this.inputRef()?.nativeElement;
    if (!input || !this.interactive()) {
      return;
    }
    input.focus();
    try {
      input.showPicker();
    } catch {
      // Not supported (Firefox/Safari): focusing the control is the best available nudge.
    }
  }
}
