/** Strip the presentation separators accepted by keyboard-wedge scanners. */
export function normalizeIsbn(input: string): string {
  return input.replace(/[\s-]/g, '').replace(/[۰-۹٠-٩]/g, digit => {
    const code = digit.codePointAt(0)!;
    return String(code >= 0x06f0 && code <= 0x06f9 ? code - 0x06f0 : code - 0x0660);
  }).toUpperCase();
}

export function isValidIsbn(input: string): boolean {
  const isbn = normalizeIsbn(input);
  if (/^\d{9}[\dX]$/.test(isbn)) {
    return [...isbn].reduce((sum, char, index) => sum + (10 - index) * (char === 'X' ? 10 : Number(char)), 0) % 11 === 0;
  }
  if (!/^\d{13}$/.test(isbn)) return false;
  const sum = [...isbn.slice(0, 12)].reduce((total, char, index) => total + Number(char) * (index % 2 ? 3 : 1), 0);
  return (10 - sum % 10) % 10 === Number(isbn[12]);
}

/** ISBN-10 can only be derived from a 978 ISBN-13, never from a 979 prefix. */
export function isbn13To10(input: string): string | null {
  const isbn = normalizeIsbn(input);
  if (!isValidIsbn(isbn) || !isbn.startsWith('978')) return null;
  const body = isbn.slice(3, 12);
  const sum = [...body].reduce((total, char, index) => total + Number(char) * (10 - index), 0);
  const remainder = (11 - sum % 11) % 11;
  return body + (remainder === 10 ? 'X' : String(remainder));
}
