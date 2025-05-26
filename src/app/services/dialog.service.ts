import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog.component';
import { AlertDialogComponent } from '../components/alert-dialog/alert-dialog.component';

@Injectable({ providedIn: 'root' })
export class DialogService {
  constructor(private dialog: MatDialog, private snackBar: MatSnackBar) {}

  confirm(title: string, message: string): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title, message },
    });
    return dialogRef.afterClosed().toPromise();
  }

  alert(title: string, message: string): Promise<void> {
    const dialogRef = this.dialog.open(AlertDialogComponent, {
      width: '400px',
      data: { title, message },
    });
    return dialogRef.afterClosed().toPromise();
  }

  toast(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
}
