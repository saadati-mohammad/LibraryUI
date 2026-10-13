import { isValidIsbn, isbn13To10, normalizeIsbn } from './isbn.util';

describe('ISBN utilities', () => {
  it('normalizes the hyphen and space suffixes used by barcode readers', () => {
    expect(normalizeIsbn(' 0-306-40615-2 ')).toBe('0306406152');
  });

  it('validates ISBN-10 and ISBN-13 checksums, including ISBN-10 X', () => {
    expect(isValidIsbn('0-306-40615-2')).toBe(true);
    expect(isValidIsbn('080442957X')).toBe(true);
    expect(isValidIsbn('9780306406157')).toBe(true);
    expect(isValidIsbn('9780306406158')).toBe(false);
    expect(isValidIsbn('1234567890123')).toBe(false);
  });

  it('normalizes Persian and Arabic-Indic digits for scan and manual entry', () => {
    expect(normalizeIsbn('۹۷۸-۰۳۰۶۴۰۶۱۵۷')).toBe('9780306406157');
    expect(normalizeIsbn('٩٧٨ ٠٣٠٦٤٠٦١٥٧')).toBe('9780306406157');
    expect(isValidIsbn('۹۷۸-۰۳۰۶۴۰۶۱۵۷')).toBe(true);
  });

  it('converts only valid 978 ISBN-13 values back to ISBN-10', () => {
    expect(isbn13To10('9780306406157')).toBe('0306406152');
    expect(isbn13To10('9791090636071')).toBeNull();
    expect(isbn13To10('9780306406158')).toBeNull();
  });
});
