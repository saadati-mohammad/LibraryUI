import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'library-theme';

/**
 * Light/dark theme state.
 *
 * The previous implementation exposed `toggleTheme()` that unconditionally threw
 * "Method not implemented", so any caller would have crashed. This holds the active
 * theme, persists it, and reflects it on <html data-theme>. All DOM/storage access is
 * guarded by isPlatformBrowser so it is safe during SSR/prerender.
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly themeSubject = new BehaviorSubject<Theme>(this.readInitialTheme());
  public readonly currentTheme$: Observable<Theme> = this.themeSubject.asObservable();

  constructor() {
    this.applyTheme(this.themeSubject.value);
  }

  /** The active theme. */
  get currentTheme(): Theme {
    return this.themeSubject.value;
  }

  /** Switch between light and dark. */
  toggleTheme(): void {
    this.setTheme(this.currentTheme === 'dark' ? 'light' : 'dark');
  }

  /** Set an explicit theme and persist the choice. */
  setTheme(theme: Theme): void {
    this.themeSubject.next(theme);
    this.applyTheme(theme);
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        // Storage can be unavailable (private mode); theming still works in-memory.
      }
    }
  }

  private readInitialTheme(): Theme {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') {
          return stored;
        }
      } catch {
        // Ignore storage access errors and fall through to the default.
      }
      // Fall back to the OS preference.
      if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  }

  private applyTheme(theme: Theme): void {
    const root = this.document?.documentElement;
    if (root) {
      root.setAttribute('data-theme', theme);
    }
  }
}
