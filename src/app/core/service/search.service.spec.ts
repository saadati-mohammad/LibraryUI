import { TestBed } from '@angular/core/testing';
import { SearchService } from './search.service';

/**
 * Regression tests for the stored-XSS fix.
 *
 * `highlightSearchTerm` output is rendered with `[innerHTML]`. Message text is
 * user-authored, so any raw markup in it must be HTML-escaped before the <mark>
 * wrapper is added — otherwise a message like `<img src=x onerror=alert(1)>` would
 * execute for every viewer.
 */
describe('SearchService', () => {
  let service: SearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('returns the input escaped when there is no search term', () => {
    const result = service.highlightSearchTerm('<script>alert(1)</script>', '');
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('escapes markup in the message while wrapping only the match in <mark>', () => {
    const result = service.highlightSearchTerm('hello <b>world</b>', 'world');
    expect(result).toContain('<mark class="search-term-highlight">world</mark>');
    expect(result).not.toContain('<b>');
    expect(result).toContain('&lt;b&gt;');
  });

  it('does not allow an HTML payload to survive in the message', () => {
    const result = service.highlightSearchTerm('<img src=x onerror=alert(1)>', 'img');
    // The security property is that no *live* tag survives: the angle brackets must
    // be escaped. The match is wrapped in <mark>, so '<img' is split by the wrapper.
    expect(result).not.toContain('<img');
    expect(result).not.toContain('<script');
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
  });

  it('treats regex metacharacters in the search term literally', () => {
    const result = service.highlightSearchTerm('a.b', '.');
    // The dot must be highlighted as a literal, not match every character.
    expect(result).toContain('<mark class="search-term-highlight">.</mark>');
  });
});
