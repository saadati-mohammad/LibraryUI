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

/** Converts a base64 data URL (or a bare base64 string) into a File, or null if it is not valid base64. */
export function base64ToFile(
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
