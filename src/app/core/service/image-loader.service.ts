import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Which authenticated image endpoint to hit. Paths are `GET /api/book/{id}/cover` and
 * `GET /api/person/{id}/picture`; both answer raw bytes and `404` when absent.
 */
export type ImageKind = 'cover' | 'picture';

/** A resolved image URL plus the safe value to bind to `[src]`. */
export interface CachedImage {
  /** The `blob:` object URL, kept so the cache entry can be revoked later. */
  objectUrl: string;
  /** The same URL wrapped for Angular's `[src]` binding. */
  safeUrl: SafeUrl;
}

/** Request options: force a refetch and drop whatever was cached for that id. */
export interface ImageLoadOptions {
  refresh?: boolean;
}

/**
 * Loads the stored book covers / member pictures that the DTOs deliberately do not carry.
 *
 * Two constraints force this shape:
 *
 * 1. **A plain `<img src="/api/book/1/cover">` cannot work.** `authInterceptor` only
 *    attaches the bearer token to `HttpClient` requests, so a direct `src` would 401 (and
 *    log a console error, breaking the "no page errors" E2E spec). The bytes must travel
 *    through `HttpClient` with `responseType: 'blob'`.
 * 2. **Object URLs must be revoked.** Every successful fetch creates one; keeping them
 *    forever leaks the whole image payload of every record ever viewed. The cache owns one
 *    URL per (kind, id) and revokes the previous one whenever an entry is replaced,
 *    refreshed or explicitly forgotten.
 *
 * Failures (404 when there is no image, 403, network errors) resolve to `null` instead of
 * throwing, so callers fall back to a placeholder silently — no snackbar, no console noise.
 */
@Injectable({ providedIn: 'root' })
export class ImageLoaderService {
  private readonly http = inject(HttpClient);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly cache = new Map<string, CachedImage>();
  /** One in-flight request per key, so N cells showing the same image make one call. */
  private readonly inFlight = new Map<string, Observable<CachedImage | null>>();
  /**
   * Keys the server answered "no image" (or "not allowed") for. Remembering the miss keeps
   * a broken/absent image from being re-requested on every change-detection pass — the
   * `hasCover`/`hasPicture` flags say an image *should* exist, so a 404 is the exception.
   */
  private readonly misses = new Set<string>();

  /** Resolved cover URLs by id, for synchronous use in table column accessors. */
  readonly covers = new Map<number, string>();
  /** Resolved picture URLs by id. */
  readonly pictures = new Map<number, string>();

  /** Synchronous lookup: the cached object URL for an id, or null when not loaded. */
  getCached(kind: ImageKind, id: number | null | undefined): string | null {
    if (id === null || id === undefined) {
      return null;
    }
    return this.cache.get(this.key(kind, id))?.objectUrl ?? null;
  }

  /** True when this id is known to have no retrievable image. */
  isKnownMissing(kind: ImageKind, id: number | null | undefined): boolean {
    return id === null || id === undefined ? true : this.misses.has(this.key(kind, id));
  }

  getCover(id: number, options?: ImageLoadOptions): Observable<CachedImage | null> {
    return this.load('cover', id, options);
  }

  getPicture(id: number, options?: ImageLoadOptions): Observable<CachedImage | null> {
    return this.load('picture', id, options);
  }

  /** Fetches several covers at once (one request each, all sharing the cache). */
  preloadCovers(ids: readonly number[]): void {
    ids.forEach((id) => this.getCover(id).subscribe({ error: () => undefined }));
  }

  preloadPictures(ids: readonly number[]): void {
    ids.forEach((id) => this.getPicture(id).subscribe({ error: () => undefined }));
  }

  /**
   * Drops a cached image: revokes its object URL and forgets it, so the next read fetches
   * fresh bytes. Call after an upload/delete so a stale image is never shown.
   */
  forget(kind: ImageKind, id: number | null | undefined): void {
    if (id === null || id === undefined) {
      return;
    }
    const cacheKey = this.key(kind, id);
    this.revoke(cacheKey);
    this.misses.delete(cacheKey);
    this.entryMap(kind).delete(id);
  }

  /** Revokes every object URL this service created. */
  revokeAll(): void {
    [...this.cache.keys()].forEach((cacheKey) => this.revoke(cacheKey));
    this.misses.clear();
    this.covers.clear();
    this.pictures.clear();
  }

  // --- Internals ------------------------------------------------------------

  private load(kind: ImageKind, id: number, options?: ImageLoadOptions): Observable<CachedImage | null> {
    if (!this.isBrowser || !Number.isFinite(id)) {
      return of(null);
    }

    const cacheKey = this.key(kind, id);

    if (options?.refresh) {
      this.revoke(cacheKey);
      this.misses.delete(cacheKey);
    } else {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return of(cached);
      }
      if (this.misses.has(cacheKey)) {
        return of(null);
      }
    }

    const pending = this.inFlight.get(cacheKey);
    if (pending) {
      return pending;
    }

    const request$ = this.http.get(this.url(kind, id), { responseType: 'blob' }).pipe(
      map((blob) => this.store(cacheKey, kind, id, blob)),
      catchError(() => {
        // No image, or not allowed to see it: remember the miss and let the caller fall
        // back to a placeholder — no throw, no snackbar, no console noise.
        this.misses.add(cacheKey);
        this.inFlight.delete(cacheKey);
        this.entryMap(kind).delete(id);
        return of(null);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.inFlight.set(cacheKey, request$);
    return request$;
  }

  private store(cacheKey: string, kind: ImageKind, id: number, blob: Blob): CachedImage {
    // Replace-and-revoke: never leave the previous URL alive for the same id.
    this.revoke(cacheKey);

    const objectUrl = URL.createObjectURL(blob);
    const entry: CachedImage = {
      objectUrl,
      safeUrl: this.sanitizer.bypassSecurityTrustUrl(objectUrl),
    };

    this.cache.set(cacheKey, entry);
    this.entryMap(kind).set(id, objectUrl);
    this.inFlight.delete(cacheKey);

    return entry;
  }

  private revoke(cacheKey: string): void {
    const previous = this.cache.get(cacheKey);
    if (previous) {
      URL.revokeObjectURL(previous.objectUrl);
      this.cache.delete(cacheKey);
    }
    this.inFlight.delete(cacheKey);
  }

  private entryMap(kind: ImageKind): Map<number, string> {
    return kind === 'cover' ? this.covers : this.pictures;
  }

  private key(kind: ImageKind, id: number): string {
    return `${kind}:${id}`;
  }

  private url(kind: ImageKind, id: number): string {
    const segment = kind === 'cover' ? 'book' : 'person';
    const leaf = kind === 'cover' ? 'cover' : 'picture';
    return `${environment.apiUrl}/${segment}/${id}/${leaf}`;
  }
}
