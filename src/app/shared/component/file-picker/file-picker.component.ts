import {
  Component,
  ElementRef,
  forwardRef,
  inject,
  input,
  output,
  signal,
  viewChild,
  ChangeDetectionStrategy
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  FileValidationRules,
  formatFileSize,
  readFileAsDataUrl,
  validateFile,
} from '../../util/file.util';

/**
 * Accessible, styled replacement for the raw `<input type="file">` control.
 *
 * Why this exists: the browser's native file control rendered differently in every
 * browser, exposed no type/size validation, showed no preview and could not be styled
 * or labelled consistently with the rest of this RTL Material app.
 *
 * Behaviour:
 *  * implements `ControlValueAccessor`, so `formControlName` binds to `File | null`
 *    (the control is `null` while nothing is selected or after a clear);
 *  * validates type and size client-side and renders a Persian error with `role="alert"`;
 *  * renders an image preview when `preview` is set (and the current value is an image);
 *  * supports click, Enter/Space and drag-and-drop on an area that is focusable only
 *    when not disabled;
 *  * announces the selected file name and size politely to screen readers.
 */
@Component({
  selector: 'app-file-picker',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './file-picker.component.html',
  styleUrl: './file-picker.component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FilePickerComponent),
      multi: true,
    },
  ],
})
export class FilePickerComponent implements ControlValueAccessor {
  /** Visible field label. Also used as the accessible name of the drop zone. */
  readonly label = input('انتخاب فایل');
  /** id assigned to the underlying `<input type="file">`. */
  readonly inputId = input<string>('appFilePicker');
  /** `data-testid` for the underlying input, so end-to-end specs can target it directly. */
  readonly testId = input<string | null>(null);
  /** `aria-describedby` target rendered by the owner (hint paragraph id). */
  readonly describedBy = input<string | null>(null);
  readonly required = input(false);
  /** `accept` attribute for the native input (e.g. `image/*`). */
  readonly accept = input<string | undefined>(undefined);
  readonly rules = input<FileValidationRules>({});
  /** Renders an image preview of the selected file (or of the current URL). */
  readonly preview = input(false);
  /** Image already stored on the server; shown until the user selects or clears. */
  readonly currentPreviewUrl = input<string | null>(null);
  readonly buttonLabel = input('انتخاب فایل');
  readonly hint = input<string | null>(null);
  readonly disabled = input(false);

  /** Emits the accepted `File` (or `null` when cleared) so owners can react. */
  readonly fileChange = output<File | null>();
  /** Emits the Persian validation message, or `null` when the picked file is valid. */
  readonly validationError = output<string | null>();

  protected readonly selectedFile = signal<File | null>(null);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly isDragging = signal(false);
  protected readonly isFocused = signal(false);
  protected readonly isDisabled = signal(false);

  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  private readonly host = inject(ElementRef<HTMLElement>);

  private onChange: (value: File | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  // --- ControlValueAccessor -------------------------------------------------

  writeValue(value: File | null): void {
    const file = value instanceof File ? value : null;
    this.selectedFile.set(file);
    this.error.set(null);
    if (file && this.preview()) {
      void this.loadPreview(file);
    } else {
      this.previewUrl.set(null);
    }
  }

  registerOnChange(fn: (value: File | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  // --- Template API ---------------------------------------------------------

  /** Size of the selected file, formatted for display; empty when nothing is picked. */
  protected selectedSize(): string {
    const file = this.selectedFile();
    return file ? formatFileSize(file.size) : '';
  }

  /** The image shown in the preview box: the freshly picked file wins over the stored one. */
  protected resolvedPreview(): string | null {
    return this.previewUrl() ?? this.currentPreviewUrl();
  }

  /** Whether the picker is interactive (not disabled by the form or the owner). */
  protected interactive(): boolean {
    return !this.disabled() && !this.isDisabled();
  }

  protected openPicker(): void {
    if (!this.interactive()) {
      return;
    }
    this.inputRef()?.nativeElement.click();
  }

  protected onZoneKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openPicker();
    }
  }

  protected onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.processFile(file);
    // Reset so picking the same file twice still fires `change`.
    input.value = '';
  }

  protected onDragOver(event: DragEvent): void {
    if (!this.interactive()) {
      return;
    }
    event.preventDefault();
    this.isDragging.set(true);
  }

  protected onDragLeave(): void {
    this.isDragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    if (!this.interactive()) {
      return;
    }
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files?.[0] ?? null;
    if (file) {
      this.processFile(file);
    }
  }

  /** Clears the selection and tells the owner (an update will send `null` = delete). */
  protected clear(): void {
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.error.set(null);
    this.onChange(null);
    this.fileChange.emit(null);
    this.validationError.emit(null);
    this.onTouched();
  }

  // --- Internals ------------------------------------------------------------

  private processFile(file: File | null): void {
    if (!file) {
      return;
    }
    const invalid = validateFile(file, this.rules());
    if (invalid) {
      // Keep any previously selected file: a rejected pick must not destroy a good one.
      this.error.set(invalid.message);
      this.validationError.emit(invalid.message);
      this.onTouched();
      return;
    }

    this.selectedFile.set(file);
    this.error.set(null);
    this.validationError.emit(null);
    this.onChange(file);
    this.fileChange.emit(file);
    this.onTouched();

    if (this.preview()) {
      void this.loadPreview(file);
    }
  }

  private async loadPreview(file: File): Promise<void> {
    const dataUrl = await readFileAsDataUrl(file);
    // Guard against a slower earlier read overwriting a newer selection.
    if (this.selectedFile() === file) {
      this.previewUrl.set(dataUrl);
    }
  }
}
