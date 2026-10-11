import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BookMetadataService } from './book-metadata.service';

describe('BookMetadataService', () => {
  let service: BookMetadataService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(BookMetadataService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests staff metadata through the same-origin API and returns review candidates', () => {
    const candidates = [{ title: 'Example', author: 'A. Author' }];
    service.lookup('9780306406157').subscribe(result => expect(result).toEqual(candidates));
    const request = http.expectOne('/api/book/metadata/isbn/9780306406157');
    expect(request.request.method).toBe('GET');
    request.flush(candidates);
  });
});
