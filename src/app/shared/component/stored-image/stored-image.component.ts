
import { Component, DestroyRef, computed, inject, input, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { catchError, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import {
  ImageKind,
  ImageLoaderService,
} from '../../../core/service/image-loader.service';

/**
 * Renders an authenticated server-side image (book cover / member picture), falling back
 * to a placeholder whenever the record has none or the request is rejected.
 *
 * The bytes are fetched through `HttpClient` by {@link ImageLoaderService} — an `<img src>`
 * pointing at the API would not carry the bearer token and would 401 (and log a console
 * error, which the "no page errors" E2E spec fails on). Object URLs are owned and revoked
 * by the service, so switching rows does not leak.
 *
 * The record id is an `Observable` input, so switching rows cancels the previous request
 * and a 404 silently becomes the placeholder.
 */
@Component({
  selector: 'app-stored-image',
  standalone: true,
  imports: [MatIconModule],
  template: `
    @if (imageUrl(); as url) {
      <img
        class="stored-image-img"
        [src]="url"
        [alt]="alt()"
        [style.width.px]="width()"
        [style.height.px]="height()"
        loading="lazy"
        decoding="async"
        (error)="onImageError()"
      />
    } @else {
      <span
        class="stored-image-placeholder"
        [style.width.px]="width()"
        [style.height.px]="height()"
        role="img"
        [attr.aria-label]="placeholderLabel()"
      >
        <mat-icon aria-hidden="true">{{ placeholderIcon() }}</mat-icon>
      </span>
    }
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './stored-image.component.css',
})
export class StoredImageComponent {
  /** Which endpoint to read. */
  readonly kind = input<ImageKind>('cover');
  /** Record id whose image should be shown. */
  readonly imageId = input<number | null>(null);
  /**
   * Set by the owner from the DTO flag (`hasCover` / `hasPicture`). When false the
   * component never issues a request.
   */
  readonly hasImage = input(false);
  readonly alt = input('تصویر');
  readonly placeholderLabel = input('تصویری ثبت نشده است');
  readonly placeholderIcon = input('image');
  readonly width = input(72);
  readonly height = input(84);
  /**
   * Optional already-resolved URL (for example a locally previewed `blob:` URL for a file
   * the operator just picked). Takes precedence over anything fetched.
   */
  readonly overrideUrl = input<string | null>(null);

  private readonly images = inject(ImageLoaderService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly remoteUrl = signal<string | null>(null);
  /** Set after an `<img>` error so a broken payload cannot loop through reloads. */
  private readonly failed = signal(false);

  protected readonly imageUrl = computed(() => {
    if (this.failed()) {
      return null;
    }
    return this.overrideUrl() ?? this.remoteUrl();
  });

  constructor() {
    toObservable(
      computed(() => {
        const has = this.hasImage();
        const id = this.imageId();
        const kind = this.kind();
        return has && id !== null && id !== undefined ? { kind, id } : null;
      }),
    )
      .pipe(
        distinctUntilChanged(
          (previous, next) => previous?.kind === next?.kind && previous?.id === next?.id,
        ),
        switchMap((target) => {
          if (!target) {
            return of<string | null>(null);
          }
          const request$ =
            target.kind === 'cover'
              ? this.images.getCover(target.id)
              : this.images.getPicture(target.id);
          // A rejected image is a placeholder, never a thrown error.
          return request$.pipe(
            map((image) => image?.objectUrl ?? null),
            catchError(() => of<string | null>(null)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((url) => {
        this.failed.set(false);
        this.remoteUrl.set(url);
      });
  }

  protected onImageError(): void {
    // The bytes arrived but are not a decodable image: show the placeholder until the
    // inputs change. Falling back keeps the layout stable.
    this.failed.set(true);
  }
}
