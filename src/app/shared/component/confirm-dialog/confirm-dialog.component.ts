import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

/**
 * A small, accessible confirmation dialog used for destructive actions
 * (delete book, deactivate person, return loan).
 *
 * Replaces the blocking native `window.confirm()`, which:
 *  - blocks the main thread,
 *  - cannot be styled or made RTL-consistent with the rest of the app,
 *  - and is not reliably announced by screen readers.
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title class="confirm-title">{{ data.title }}</h2>
    <mat-dialog-content class="confirm-content direction-rtl">{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" (click)="onCancel()">
        {{ data.cancelLabel || 'انصراف' }}
      </button>
      <button mat-flat-button color="primary" type="button" cdkFocusInitial (click)="onConfirm()">
        {{ data.confirmLabel || 'تأیید' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .confirm-title {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 600;
      }
      .confirm-content {
        margin-top: 8px;
        line-height: 1.7;
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  protected readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent, boolean>);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
