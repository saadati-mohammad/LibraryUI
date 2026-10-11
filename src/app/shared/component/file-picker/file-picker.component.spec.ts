import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { FilePickerComponent } from './file-picker.component';
import { IMAGE_FILE_RULES } from '../../util/file.util';

/** Host that binds the picker to a reactive control, the way both forms use it. */
@Component({
  imports: [FilePickerComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-file-picker
      inputId="cover"
      [formControl]="control"
      [rules]="rules"
      [preview]="preview()"
      [currentPreviewUrl]="storedUrl()"
      (validationError)="lastError.set($event)"
      (fileChange)="lastFile.set($event)"
    ></app-file-picker>
  `,
})
class HostComponent {
  readonly control = new FormControl<File | null>(null);
  readonly rules = IMAGE_FILE_RULES;
  readonly preview = signal(true);
  readonly storedUrl = signal<string | null>(null);
  readonly lastError = signal<string | null>('unset');
  readonly lastFile = signal<File | null>(null);
}

/** Supplies the FileList surface consumed by the picker in the DOM emulator. */
function setFiles(input: HTMLInputElement, files: File[]): void {
  Object.defineProperty(input, 'files', {
    value: files as unknown as FileList,
    configurable: true,
  });
  input.dispatchEvent(new Event('change'));
}

describe('FilePickerComponent', () => {
  let hostFixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let input: HTMLInputElement;

  function hostElement(): HTMLElement {
    return hostFixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();

    hostFixture = TestBed.createComponent(HostComponent);
    host = hostFixture.componentInstance;
    hostFixture.detectChanges();
    input = hostElement().querySelector('input[type="file"]') as HTMLInputElement;
  });

  it('exposes the native input under the requested id with an accessible label', () => {
    expect(input).not.toBeNull();
    expect(input.id).toBe('cover');
    expect(hostElement().querySelector('.file-picker-label')?.textContent).toContain('انتخاب فایل');
  });

  it('accepts a valid image, writes it to the form control and announces the name', () => {
    const file = new File(['x'], 'cover.png', { type: 'image/png' });

    setFiles(input, [file]);
    hostFixture.detectChanges();

    expect(host.control.value).toBe(file);
    expect(host.lastFile()).toBe(file);
    expect(host.lastError()).toBeNull();
    expect(hostElement().textContent).toContain('cover.png');
    expect(hostElement().textContent).toContain('بایت');
  });

  it('rejects a non-image file with a Persian error and keeps the control clean', () => {
    setFiles(input, [new File(['x'], 'doc.pdf', { type: 'application/pdf' })]);
    hostFixture.detectChanges();

    expect(host.control.value).toBeNull();
    expect(host.lastError()).toContain('تصویری');
    expect(hostElement().querySelector('[role="alert"]')?.textContent).toContain('تصویری');
  });

  it('rejects an oversized image', () => {
    const big = new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' });

    setFiles(input, [big]);
    hostFixture.detectChanges();

    expect(host.control.value).toBeNull();
    expect(host.lastError()).toContain('حجم فایل');
  });

  it('clears the selection to null so an update can signal deletion', () => {
    setFiles(input, [new File(['x'], 'cover.png', { type: 'image/png' })]);
    hostFixture.detectChanges();
    expect(host.control.value).not.toBeNull();

    const clear = hostElement().querySelector('.clear-button') as HTMLButtonElement;
    expect(clear).not.toBeNull();
    clear.click();
    hostFixture.detectChanges();

    expect(host.control.value).toBeNull();
    expect(host.lastFile()).toBeNull();
  });

  it('mirrors the tri-state value written by the form (File / null)', () => {
    const file = new File(['x'], 'cover.png', { type: 'image/png' });
    host.control.setValue(file);
    hostFixture.detectChanges();

    expect(hostElement().textContent).toContain('cover.png');

    host.control.setValue(null);
    hostFixture.detectChanges();

    expect(hostElement().textContent).not.toContain('cover.png');
  });

  it('shows the stored image as the preview until a new file replaces it', () => {
    host.storedUrl.set('https://example.test/cover.jpg');
    hostFixture.detectChanges();

    const image = hostElement().querySelector('.preview-image') as HTMLImageElement;
    expect(image?.getAttribute('src')).toBe('https://example.test/cover.jpg');
  });

  it('is a keyboard-operable drop zone', () => {
    const zone = hostElement().querySelector('.drop-zone') as HTMLElement;

    expect(zone.getAttribute('role')).toBe('button');
    expect(zone.getAttribute('tabindex')).toBe('0');
    expect(zone.getAttribute('aria-labelledby')).toContain('cover');
  });
});
