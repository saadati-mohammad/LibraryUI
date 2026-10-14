import { TestBed } from '@angular/core/testing';
import { LoanFormFactory, requireSelectedId } from './loan-form.factory';
import { FormControl } from '@angular/forms';

describe('LoanFormFactory', () => {
  let factory: LoanFormFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [LoanFormFactory] });
    factory = TestBed.inject(LoanFormFactory);
  });

  it('validates loan form requiring selected person and book IDs', () => {
    const form = factory.createLoanForm();
    expect(form.invalid).toBe(true);

    // Free-typed string does not satisfy requireSelectedId
    form.patchValue({ personId: 'John Doe', bookId: 'Some Book' });
    expect(form.get('personId')?.hasError('selectionRequired')).toBe(true);
    expect(form.get('bookId')?.hasError('selectionRequired')).toBe(true);

    // Numeric ID satisfies requireSelectedId
    form.patchValue({ personId: 1, bookId: 2, notes: 'Test note' });
    expect(form.valid).toBe(true);
  });

  it('creates filters form with expected initial controls', () => {
    const filters = factory.createFiltersForm();
    expect(filters.get('personNationalId')?.value).toBe('');
    expect(filters.get('bookIsbn')?.value).toBe('');
    expect(filters.get('status')?.value).toBeNull();
  });

  it('requireSelectedId rejects non-numbers and accepts numbers', () => {
    const validator = requireSelectedId();
    expect(validator(new FormControl(null))).toEqual({ selectionRequired: true });
    expect(validator(new FormControl('text'))).toEqual({ selectionRequired: true });
    expect(validator(new FormControl(123))).toBeNull();
    expect(validator(new FormControl(0))).toBeNull();
  });
});
