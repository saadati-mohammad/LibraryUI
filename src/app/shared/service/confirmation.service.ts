import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../component/confirm-dialog/confirm-dialog.component';

/**
 * Promise-based wrapper around {@link ConfirmDialogComponent}.
 *
 * Usage:
 * ```ts
 * if (await this.confirmation.confirm({ title: '...', message: '...' })) { ... }
 * ```
 *
 * Closing the dialog by clicking the backdrop or pressing Escape resolves to
 * `false`, matching the safe default of the native `confirm()` it replaces.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmationService {
  private readonly dialog = inject(MatDialog);

  async confirm(data: ConfirmDialogData): Promise<boolean> {
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data,
        autoFocus: 'dialog',
        restoreFocus: true,
        width: '420px',
        maxWidth: '90vw',
        direction: 'rtl',
      },
    );
    // `?? false` guards against an undefined emission (defensive; close always
    // passes a boolean here).
    return (await firstValueFrom(ref.afterClosed())) ?? false;
  }
}
