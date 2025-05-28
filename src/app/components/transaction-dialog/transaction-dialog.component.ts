// src/app/components/transaction-dialog/transaction-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Record } from '../records/entity/record-interface';
// import { Record } from '../../models/record.model';

@Component({
  selector: 'app-transaction-dialog',
  templateUrl: './transaction-dialog.component.html',
})
export class TransactionDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { date: Date; transactions: Record[] }
  ) {}
}
