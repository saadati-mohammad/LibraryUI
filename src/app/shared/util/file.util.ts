/**
 * Browser file helpers shared by the feature components.
 *
 * These were previously duplicated inside {@code BookComponent} and
 * {@code PersonComponent} (identical base64→File conversion and the same
 * createElement('a') download dance). Centralising them removes the duplication
 * and keeps the raw DOM/atob usage in one typed, testable place.
 *
 * Every function here is a no-op on the server (SSR): the app is client-rendered,
 * but guarding keeps these helpers safe if called before the DOM exists.
 */

import { isPlatformBrowser } from '@angular/common';

/** A client-side file rejection with a ready-to-render Persian message. */
export interface FileValidationError {
  /** Persian message shown under the picker. */
  message: string;
}

/** Validation rules for a file picker. */
export interface FileValidationRules {
  /**
   * Accepted MIME type prefixes (e.g. `['image/']`). A file is accepted when its
   * `type` starts with any entry. Empty/undefined accepts every type.
   */
  acceptPrefixes?: string[];
  /**
   * Accepted extensions, lower-case and including the dot (e.g. `['.xlsx']`).
   * Checked when given, so an extension-restricted upload cannot be bypassed by a
   * browser reporting an empty MIME type.
   */
  acceptExtensions?: string[];
  /** Maximum size in bytes. */
  maxBytes?: number;
}

/** Validation rules for book covers / profile pictures (images, max 2 MB). */
export const IMAGE_FILE_RULES: FileValidationRules = {
  acceptPrefixes: ['image/'],
  maxBytes: 2 * 1024 * 1024,
};

/** Validation rules for the Excel import workbooks. */
export const EXCEL_FILE_RULES: FileValidationRules = {
  acceptExtensions: ['.xlsx'],
  maxBytes: 10 * 1024 * 1024,
};

/** Formats a byte count as a short, human-readable Persian-agnostic size (e.g. `1.4 مگابایت`). */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '—';
  }
  if (bytes < 1024) {
    return `${bytes} بایت`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${Math.round(kb)} کیلوبایت`;
  }
  return `${(kb / 1024).toFixed(1)} مگابایت`;
}

/**
 * Validates a file against the rules and returns a Persian error, or `null` when valid.
 *
 * The previous per-component checks were duplicated (and the person form had none at
 * all), so a 40 MB avatar or a PDF renamed to `.xlsx` reached the API. Keeping the
 * rules here means both features reject the same inputs with the same wording.
 */
export function validateFile(
  file: File,
  rules: FileValidationRules,
): FileValidationError | null {
  const prefixes = rules.acceptPrefixes ?? [];
  if (prefixes.length > 0 && !prefixes.some((prefix) => file.type.startsWith(prefix))) {
    return { message: 'فقط فایل‌های تصویری (JPG، PNG، WEBP و …) مجاز هستند.' };
  }

  const extensions = rules.acceptExtensions ?? [];
  if (extensions.length > 0) {
    const name = file.name.toLowerCase();
    if (!extensions.some((extension) => name.endsWith(extension))) {
      return { message: `فرمت فایل نامعتبر است. فقط فایل با پسوند ${extensions.join('، ')} پذیرفته می‌شود.` };
    }
  }

  if (rules.maxBytes !== undefined && file.size > rules.maxBytes) {
    return {
      message: `حجم فایل نباید بیشتر از ${formatFileSize(rules.maxBytes)} باشد. حجم فایل انتخابی: ${formatFileSize(file.size)}.`,
    };
  }

  return null;
}

/**
 * Rebuilds the editable `File` for a stored binary field, or `null` when there is nothing
 * that can be rebuilt.
 *
 * The tri-state this exists to protect: `null` here means "there is no local file", which
 * is NOT the same as "the operator cleared the image". Only an explicit clear arms a
 * deletion. A plain URL (`https://…/cover.jpg`) cannot become a `File`, so treating a
 * failed reconstruction as "cleared" silently wiped stored images on every save.
 */
export function storedImageToFile(
  value: File | string | null | undefined,
  fileName: string,
  mimeType = 'image/jpeg',
): File | null {
  if (value instanceof File) {
    return value;
  }
  if (!isBase64Image(value)) {
    return null;
  }
  return base64ToFile(value, fileName, mimeType);
}

/**
 * True when a stored value is a decodable base64 image payload (a `data:` URL or a long
 * bare base64 blob). A plain image URL returns false: it is a perfectly displayable image
 * but it is not base64, and `atob` on it would throw.
 */
export function isBase64Image(value: string | null | undefined): boolean {
  if (typeof value !== 'string' || value.length < 32) {
    return false;
  }
  if (value.startsWith('data:image')) {
    return true;
  }
  // A URL is not base64, even though its characters are all in the base64 alphabet.
  if (value.includes('://') || value.includes('/')) {
    return false;
  }
  return /^[A-Za-z0-9+/=\s]+$/.test(value);
}

/** Converts a base64 data URL (or a bare base64 string) into a File, or null if it is not valid base64. */export function base64ToFile(
  binaryData: string | null | undefined,
  fileName: string,
  mimeType: string,
): File | null {
  if (typeof binaryData !== 'string' || binaryData.length === 0) {
    return null;
  }

  // A data URL looks like "data:image/jpeg;base64,AAAA"; keep only the payload.
  const base64String = binaryData.split(',')[1] || binaryData;

  try {
    const byteArray = Uint8Array.from(atob(base64String), (char) => char.charCodeAt(0));
    const blob = new Blob([byteArray], { type: mimeType });
    return new File([blob], fileName, { type: mimeType });
  } catch {
    // Not a base64 payload (e.g. a plain URL) — there is no file to build.
    return null;
  }
}

/** Reads a File as a data URL. Resolves to null outside the browser. */
export function readFileAsDataUrl(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/**
 * Triggers a browser download of the given URL using a transient anchor element.
 * No-op when not running in a browser. The anchor is always removed, even if
 * the click throws.
 */
export function downloadUrl(url: string, fileName: string, platformId: object): void {
  if (!isPlatformBrowser(platformId)) {
    return;
  }

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    link.remove();
  }
}
