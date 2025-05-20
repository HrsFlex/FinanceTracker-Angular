import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AccountServiceService } from 'src/app/services/account-service.service';
import { CategoryService } from 'src/app/services/category-service.service';
import { RecordService } from 'src/app/services/record.service';
import {
  Accounts,
  Category,
  Record,
  RecordForm,
} from '../entity/record-interface';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-record-upsert',
  templateUrl: './record-upsert.component.html',
  styleUrls: ['./record-upsert.component.css'],
})
export class RecordUpsertComponent implements OnInit {
  recordForm!: FormGroup<RecordForm>;
  accounts: Accounts[] = [];
  categories: Category[] = [];
  transactionTypes = ['income', 'expense', 'transfer'];

  constructor(
    private accountService: AccountServiceService,
    private categoryService: CategoryService,
    private recordService: RecordService,
    private route: ActivatedRoute
  ) {
    this.recordForm = new FormGroup<RecordForm>({
      type: new FormControl<'income' | 'expense' | 'transfer'>('expense', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      fromAccountId: new FormControl<string | null>(null, {
        validators: [Validators.required],
      }),
      toAccountId: new FormControl<string | null>(null),
      categoryId: new FormControl<string | null>(null, {
        validators: [Validators.required],
      }),
      description: new FormControl<string>('', { nonNullable: true }),
      amount: new FormControl<number | null>(null, {
        validators: [Validators.required, Validators.min(0.01)],
      }),
      date: new FormControl<string>(new Date().toISOString(), {
        nonNullable: true,
        validators: [Validators.required],
      }),
    });
  }

  ngOnInit(): void {
    this.loadAccounts();
    this.loadCategories();
    this.setupTypeWatcher();
    const recordId = this.route.snapshot.paramMap.get('id');
    if (recordId) {
      this.loadRecordForEdit(recordId);
    }
  }

  public loadAccounts() {
    this.accountService.getAccounts(1, 100, 'name').subscribe({
      next: (data) => (this.accounts = data.accounts || []),
      error: (err) => console.error('Failed to load accounts', err),
    });
  }

  public loadCategories() {
    this.categoryService.getCategories(1, 100, 'name').subscribe({
      next: (data) => (this.categories = data.categories || []),
      error: (err) => console.error('Failed to load categories', err),
    });
  }

  public setupTypeWatcher() {
    this.recordForm.get('type')?.valueChanges.subscribe((type) => {
      const toAccount = this.recordForm.get('toAccountId');
      const category = this.recordForm.get('categoryId');

      if (type === 'transfer') {
        toAccount?.addValidators([Validators.required]);
        category?.clearValidators();
      } else {
        toAccount?.clearValidators();
        category?.addValidators([Validators.required]);
      }

      toAccount?.updateValueAndValidity();
      category?.updateValueAndValidity();
    });
  }

  private loadRecordForEdit(id: string): void {
    this.recordService.getRecordById(id.toString()).subscribe({
      // id ko number se string kiya hai
      next: (record) => {
        this.recordForm.get('type')?.setValue(record.type);
        this.recordForm.get('fromAccountId')?.setValue(record.fromAccountId);
        this.recordForm
          .get('toAccountId')
          ?.setValue(record.toAccountId ?? null);
        this.recordForm.get('categoryId')?.setValue(record.categoryId ?? null);
        this.recordForm.get('description')?.setValue(record.description);
        this.recordForm.get('amount')?.setValue(record.amount);
        this.recordForm.get('date')?.setValue(record.date);
      },
      error: (err) => {
        console.error('Failed to load record', err);
      },
    });
  }

  public submitForm() {
    if (this.recordForm.invalid) {
      this.recordForm.markAllAsTouched();
      return;
    }

    const formValue = this.recordForm.getRawValue();

    // Narrow the type manually and safely
    const type = formValue.type as 'income' | 'expense' | 'transfer';

    // Validate required fields based on type
    if (
      formValue.fromAccountId === null ||
      formValue.amount === null ||
      (type !== 'transfer' && formValue.categoryId === null) ||
      (type === 'transfer' && formValue.toAccountId === null)
    ) {
      alert('Form contains invalid or incomplete data.');
      return;
    }

    const record: Record = {
      type,
      fromAccountId: formValue.fromAccountId,
      toAccountId: type === 'transfer' ? formValue.toAccountId! : undefined,
      categoryId: type !== 'transfer' ? formValue.categoryId! : '0', // dummy or backend-handled
      description: formValue.description,
      amount: formValue.amount,
      date: formValue.date,
    };

    this.recordService.createRecord(record).subscribe({
      next: () => {
        alert('Record saved successfully!');
        this.resetForm();
      },
      error: (err) => {
        console.error('Failed to save record', err);
        alert(`Failed to save record: ${err.message}`);
      },
    });
  }

  private resetForm() {
    this.recordForm.reset({
      type: 'income',
      fromAccountId: null,
      toAccountId: null,
      categoryId: null,
      description: '',
      amount: null,
      date: new Date().toISOString(),
    });
  }
}
