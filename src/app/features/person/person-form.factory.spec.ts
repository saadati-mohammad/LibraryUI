import { TestBed } from '@angular/core/testing';
import { PersonFormFactory } from './person-form.factory';

describe('PersonFormFactory', () => {
  let factory: PersonFormFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [PersonFormFactory] });
    factory = TestBed.inject(PersonFormFactory);
  });

  it('requires member identity fields and validates email and national ID', () => {
    const form = factory.createEditorForm();
    expect(form.invalid).toBe(true);
    form.patchValue({ firstName: 'مریم', lastName: 'رضایی', email: 'invalid', nationalId: '123' });
    expect(form.get('email')?.hasError('email')).toBe(true);
    expect(form.get('nationalId')?.hasError('pattern')).toBe(true);
    form.patchValue({ email: 'maryam@example.test', nationalId: '1234567890' });
    expect(form.valid).toBe(true);
  });

  it('keeps member filters active by default and preserves import and picture controls', () => {
    const filters = factory.createFiltersForm();
    expect(filters.get('active')?.value).toBe(true);
    expect(filters.get('nationalId')).toBeDefined();
    expect(factory.createImportForm().get('excelFile')?.value).toBeNull();
    expect(factory.createEditorForm().get('profilePicture')?.value).toBeNull();
  });
});
