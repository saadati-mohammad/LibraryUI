import { Injectable, isDevMode } from '@angular/core';

/**
 * Thin logging facade.
 *
 * Debug/info logs are suppressed in production builds (isDevMode() is false after
 * `ng build --configuration production`), so diagnostic chatter such as
 * "Processing WebSocket message: ..." and full message payloads never reach the
 * browser console of real users. Warnings and errors are always emitted because they
 * are actionable in production.
 */
@Injectable({
  providedIn: 'root'
})
export class LoggerService {

  debug(message: string, ...optionalParams: unknown[]): void {
    if (isDevMode()) {
      console.log(message, ...optionalParams);
    }
  }

  info(message: string, ...optionalParams: unknown[]): void {
    if (isDevMode()) {
      console.info(message, ...optionalParams);
    }
  }

  warn(message: string, ...optionalParams: unknown[]): void {
    console.warn(message, ...optionalParams);
  }

  error(message: string, ...optionalParams: unknown[]): void {
    console.error(message, ...optionalParams);
  }
}
