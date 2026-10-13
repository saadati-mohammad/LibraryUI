import { TestBed } from '@angular/core/testing';
import { BookFormFactory } from './book-form.factory';

describe('BookFormFactory', () => {
  let factory: BookFormFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [BookFormFactory] });
    factory = TestBed.inject(BookFormFactory);
  });

  it('requires a title, author, subject, and at least one ISBN', () => {
    const form = factory.createEditorForm();
    expect(form.invalid).toBe(true);

    form.patchValue({ title: 'کتاب', author: 'نویسنده', subject: 'داستان' });
    expect(form.hasError('isbnRequired')).toBe(true);

    form.patchValue({ isbn13: '9780306406157' });
    expect(form.hasError('isbnRequired')).toBe(false);
    expect(form.get('title')?.valid).toBe(true);
  });

  it('defaults the list to active records and preserves the supported field filters', () => {
    const filters = factory.createFiltersForm();
    expect(filters.get('active')?.value).toBe(true);
    expect(filters.get('isbn13')).toBeDefined();
    expect(filters.get('publicationDate')).toBeDefined();
  });

  it('rejects an invalid ISBN checksum and accepts Persian digit input', () => {
    const form = factory.createEditorForm();
    form.patchValue({ title: 'کتاب', author: 'نویسنده', subject: 'داستان', isbn13: '9780306406158' });
    expect(form.get('isbn13')?.hasError('isbnChecksum')).toBe(true);
    form.patchValue({ isbn13: '۹۷۸-۰۳۰۶۴۰۶۱۵۷' });
    expect(form.get('isbn13')?.valid).toBe(true);
  });
});
