import { Injectable, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { LoanStatus } from '../../core/model/bookLoanModel';

/**
 * Validator for a `<mat-autocomplete>`-backed control.
 *
 * `mat-autocomplete` writes the raw string into the control while the user types, so a
 * free-typed name would otherwise be posted as an ID. Requiring a number forces a
 * real option selection.
 */
export function requireSelectedId(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null =>
    typeof control.value === 'number' ? null : { selectionRequired: true };
}

/** Owns loan form schemas so LoanComponent can focus on circulation workflows. */
@Injectable({ providedIn: 'root' })
export class LoanFormFactory {
  private readonly formBuilder = inject(FormBuilder);

  createLoanForm(): FormGroup {
    return this.formBuilder.group({
      personId: [null, [Validators.required, requireSelectedId()]],
      bookId: [null, [Validators.required, requireSelectedId()]],
      notes: [''],
    });
  }

  createFiltersForm(): FormGroup {
    return this.formBuilder.group({
      personNationalId: [''],
      bookIsbn: [''],
      status: [null as LoanStatus | null],
    });
  }
}
