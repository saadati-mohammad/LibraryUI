import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { BookService } from './book.service';
import { BookModel } from '../model/bookModel';

describe('BookService', () => {
  let service: BookService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BookService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('sends pagination and falsy filter values as query params', () => {
    service.getBookList({ active: false, copyCount: 0 }, 1, 20).subscribe();

    const req = httpMock.expectOne((r) => r.url === service.baseUrl);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('size')).toBe('20');
    // Falsy values must survive (they are meaningful filters), so they are stringified.
    expect(req.request.params.get('active')).toBe('false');
    expect(req.request.params.get('copyCount')).toBe('0');
    req.flush({ content: [], totalPages: 0, totalElements: 0, size: 20, number: 1 });
  });

  it('omits null/undefined/empty filter values', () => {
    service.getBookList({ title: '', author: null as unknown as string }, 0, 10).subscribe();

    const req = httpMock.expectOne((r) => r.url === service.baseUrl);
    expect(req.request.params.has('title')).toBe(false);
    expect(req.request.params.has('author')).toBe(false);
    req.flush({ content: [], totalPages: 0, totalElements: 0, size: 10, number: 0 });
  });

  it('posts Excel imports as multipart and expects a JSON envelope', () => {
    const file = new File(['x'], 'books.xlsx');
    service.importBooksFromExcel(file).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.imported).toBe(3);
    });

    const req = httpMock.expectOne(`${service.baseUrlExcel}/excel-import/books`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush({ success: true, imported: 3, message: 'ok' });
  });

  it('creates a book with the JSON part plus optional cover file', () => {
    const book = { title: 'T' } as BookModel;
    const cover = new File(['x'], 'cover.png');
    service.addBook(book, cover).subscribe();

    const req = httpMock.expectOne(service.baseUrl);
    const body = req.request.body as FormData;
    expect(body.get('book')).toBeTruthy();
    expect(body.get('bookCoverFile')).toBeTruthy();
    req.flush(book);
  });
});
