import { EnvironmentProviders, Provider } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

/**
 * Shared TestBed providers for component tests.
 *
 * Components in this app inject services that depend on `HttpClient`, the router,
 * and Angular Material animations. The default CLI-generated specs omitted these,
 * so `ng test` failed with NG0201 before any assertion ran. Centralising the
 * providers here keeps every component spec consistent and future-proof.
 *
 * The return type is the union of both provider shapes: `provideRouter` and friends
 * yield `EnvironmentProviders`, while `provideHttpClientTesting` yields plain
 * `Provider[]`. `TestBed.configureTestingModule({ providers })` accepts both.
 *
 * Note: `provideHttpClientTesting()` must come after `provideHttpClient()` so the
 * testing backend overrides the real one.
 */
export const provideTestProviders = (): (EnvironmentProviders | Provider)[] => [
  provideRouter([]),
  provideAnimationsAsync(),
  provideHttpClient(),
  provideHttpClientTesting(),
];
