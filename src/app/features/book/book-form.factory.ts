import { Injectable, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { notFutureDate } from '../../core/util/date.util';
import { isValidIsbn, normalizeIsbn } from '../../core/util/isbn.util';

/** ISO date of today — the upper bound for the publication-date control. */
export function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, '0')}-${`${now.getDate()}`.padStart(2, '0')}`;
}

/** Owns the book editor/filter form shape so the screen component focuses on workflow. */
@Injectable({ providedIn: 'root' })
export class BookFormFactory {
  private readonly formBuilder = inject(FormBuilder);

  createEditorForm(): FormGroup {
    return this.formBuilder.group({
      isbn10: [null, optionalIsbn],
      title: [null, Validators.required],
      author: [null, Validators.required],
      translator: [null],
      description: [''],
      publisher: [null],
      isbn13: [null, optionalIsbn],
      deweyDecimal: [null],
      congressClassification: [null],
      subject: [null, Validators.required],
      summary: [''],
      publicationDate: [null, [notFutureDate]],
      pageCount: [null, [Validators.min(1), Validators.max(100000)]],
      language: [null],
      edition: [null],
      active: [true, Validators.required],
      copyCount: [null, [Validators.min(0), Validators.max(100000)]],
      librarySection: [null],
      shelfCode: [null],
      rowNumbers: [null],
      columnNumber: [null],
      positionNote: [''],
      // Null is the file-picker's explicit signal to remove a stored cover.
      bookCoverFile: [null as File | null],
    }, { validators: isbnRequired });
  }

  createFiltersForm(): FormGroup {
    return this.formBuilder.group({
      title: [''],
      author: [''],
      translator: [''],
      publisher: [''],
      isbn10: [''],
      isbn13: [''],
      description: [''],
      deweyDecimal: [''],
      congressClassification: [''],
      subject: [''],
      summary: [''],
      publicationDate: [null],
      pageCount: [null, [Validators.min(1)]],
      language: [''],
      edition: [''],
      // Inactive (soft-deleted) records stay hidden unless explicitly requested.
      active: [true],
      copyCount: [null, [Validators.min(0)]],
      librarySection: [''],
      shelfCode: [''],
      rowNumbers: [''],
      columnNumber: [''],
      positionNote: [''],
    });
  }
}

function isbnRequired(control: AbstractControl): { isbnRequired: true } | null {
  const isbn10 = String(control.get('isbn10')?.value ?? '').trim();
  const isbn13 = String(control.get('isbn13')?.value ?? '').trim();
  return isbn10 || isbn13 ? null : { isbnRequired: true };
}

function optionalIsbn(control: AbstractControl): { isbnChecksum: true } | null {
  const value = String(control.value ?? '').trim();
  return value && !isValidIsbn(normalizeIsbn(value)) ? { isbnChecksum: true } : null;
}
