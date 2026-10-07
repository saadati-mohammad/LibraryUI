import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';

import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;
  let document: Document;

  beforeEach(() => {
    localStorage.removeItem('library-theme');
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
    document = TestBed.inject(DOCUMENT);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('toggleTheme switches between light and dark instead of throwing', () => {
    const initial = service.currentTheme;
    expect(() => service.toggleTheme()).not.toThrow();
    expect(service.currentTheme).not.toBe(initial);
  });

  it('reflects the active theme on the document element', () => {
    service.setTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    service.setTheme('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('persists the chosen theme', () => {
    service.setTheme('dark');
    expect(localStorage.getItem('library-theme')).toBe('dark');
  });

  it('emits the new theme to subscribers', (done) => {
    service.setTheme('dark');
    service.currentTheme$.subscribe((theme) => {
      expect(theme).toBe('dark');
      done();
    });
  });
});
