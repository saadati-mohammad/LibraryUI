import { Injectable, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { notFutureDate } from '../../core/util/date.util';

/** Owns member form schemas so the page component can focus on member workflows. */
@Injectable({ providedIn: 'root' })
export class PersonFormFactory {
  private readonly formBuilder = inject(FormBuilder);

  createEditorForm(): FormGroup {
    return this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      nationalId: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      phone: [''],
      birthDate: [null, [notFutureDate]],
      membershipType: [''],
      address: [''],
      notes: [''],
      active: [true, Validators.required],
      // Null signals that an existing profile picture should be removed.
      profilePicture: [null as File | null],
    });
  }

  createFiltersForm(): FormGroup {
    return this.formBuilder.group({
      firstName: [''],
      lastName: [''],
      email: [''],
      phone: [''],
      nationalId: [''],
      membershipType: [''],
      // Soft-deleted members stay hidden unless explicitly requested.
      active: [true],
    });
  }

  createImportForm(): FormGroup {
    return this.formBuilder.group({ excelFile: [null as File | null] });
  }
}
