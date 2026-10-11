import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { BookLoanService } from './book-loan.service';
import { BookLoanModel } from '../model/bookLoanModel';

describe('BookLoanService', () => {
  let service: BookLoanService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    service = TestBed.inject(BookLoanService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('sends paging, sorting and the supplied filters as query params', () => {
    service.getLoanList({ status: 'ON_LOAN', personNationalId: '0012345678' }, 2, 50, 'dueDate,asc')
      .subscribe();

    const req = httpMock.expectOne((r) => r.url === service.baseUrl);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('50');
    expect(req.request.params.get('sort')).toBe('dueDate,asc');
    expect(req.request.params.get('status')).toBe('ON_LOAN');
    expect(req.request.params.get('personNationalId')).toBe('0012345678');
    req.flush({ content: [], totalPages: 0, totalElements: 0, size: 50, number: 2 });
  });

  it('omits null/undefined/empty filters but keeps the paging defaults', () => {
    service.getLoanList({ status: null, bookIsbn: '', dueDateFrom: undefined }).subscribe();

    const req = httpMock.expectOne((r) => r.url === service.baseUrl);
    expect(req.request.params.has('status')).toBe(false);
    expect(req.request.params.has('bookIsbn')).toBe(false);
    expect(req.request.params.has('dueDateFrom')).toBe(false);
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('10');
    expect(req.request.params.get('sort')).toBe('id,desc');
    req.flush({ content: [], totalPages: 0, totalElements: 0, size: 10, number: 0 });
  });

  it('creates a loan with a JSON body', () => {
    service.createLoan({ personId: 1, bookId: 2, notes: 'n' }).subscribe();

    const req = httpMock.expectOne(service.baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ personId: 1, bookId: 2, notes: 'n' });
    req.flush({} as BookLoanModel);
  });

  it('returns a loan via PUT /{id}/return', () => {
    service.returnLoan(7).subscribe();

    const req = httpMock.expectOne(`${service.baseUrl}/7/return`);
    expect(req.request.method).toBe('PUT');
    req.flush({} as BookLoanModel);
  });
});
