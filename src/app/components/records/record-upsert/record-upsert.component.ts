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
import { ActivatedRoute, Router } from '@angular/router';
import { DialogService } from 'src/app/services/dialog.service';
import { MatSnackBar } from '@angular/material/snack-bar';

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
  recordId: string | null = null;
  isEditing: boolean = false;
  isSubmitting: boolean = false; // Add loading state

  constructor(
    private accountService: AccountServiceService,
    private categoryService: CategoryService,
    private recordService: RecordService,
    private route: ActivatedRoute,
    private router: Router,
    private dialogService: DialogService,
    private snackBar: MatSnackBar
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
    this.recordId = this.route.snapshot.paramMap.get('id');
    console.log('Record ID from route:', this.recordId); // Debug: Verify ID
    if (this.recordId) {
      this.isEditing = true;
      this.loadRecordForEdit(this.recordId);
    } else {
      console.log('Creating new record');
    }
    this.loadAccounts();
    this.loadCategories();
    this.setupTypeWatcher();
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
  public onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      // Convert datetime-local value (YYYY-MM-DDTHH:mm) to ISO string
      const isoDate = `${input.value}:00Z`; // Append seconds and UTC
      this.recordForm.get('date')?.setValue(isoDate);
    }
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
    //Solverd the date time issue.
    this.recordService.getRecordById(id.toString()).subscribe({
      next: (record) => {
        console.log('Loaded record:', record); // Debug: Verify record data
        const dateValue = record.date.includes('T')
          ? record.date
          : `${record.date}T00:00:00Z`; // Add default time if missing
        this.recordForm.get('type')?.setValue(record.type);
        this.recordForm.get('fromAccountId')?.setValue(record.fromAccountId);
        this.recordForm
          .get('toAccountId')
          ?.setValue(record.toAccountId ?? null);
        this.recordForm.get('categoryId')?.setValue(record.categoryId ?? null);
        this.recordForm.get('description')?.setValue(record.description);
        this.recordForm.get('amount')?.setValue(record.amount);
        this.recordForm.get('date')?.setValue(dateValue);
      },
      error: (err) => {
        console.error('Failed to load record', err);
        this.dialogService.alert(
          'Error',
          'Failed to load record: ' + err.message
        );
        this.router.navigate(['/records']);
      },
    });
  }
  public submitForm() {
    if (this.recordForm.invalid) {
      this.recordForm.markAllAsTouched();
      return;
    }
    this.isSubmitting = true; // Disable submission
    const formValue = this.recordForm.getRawValue();
    const type = formValue.type as 'income' | 'expense' | 'transfer';

    // Validate required fields based on type
    if (
      formValue.fromAccountId === null ||
      formValue.amount === null ||
      (type !== 'transfer' && formValue.categoryId === null) ||
      (type === 'transfer' && formValue.toAccountId === null)
    ) {
      this.dialogService.alert(
        'Validation Error',
        'Form contains invalid or incomplete data.'
      );
      return;
    }

    const record: Record = {
      id: this.recordId || undefined,
      type,
      fromAccountId: formValue.fromAccountId,
      toAccountId: type === 'transfer' ? formValue.toAccountId! : undefined,
      categoryId: type !== 'transfer' ? formValue.categoryId! : '0', // dummy or backend-handled
      description: formValue.description,
      amount: formValue.amount,
      date: formValue.date,
    };
    console.log('Submitting record:', record);

    const request =
      this.isEditing && this.recordId
        ? this.recordService.updateRecord(record)
        : this.recordService.createRecord(record);

    request.subscribe({
      next: () => {
        this.isSubmitting = false; // Re-enable after success
        this.dialogService
          .confirm(
            'Success',
            `Are you sure to ${this.isEditing ? 'update' : 'save'} the data?`
          )
          .then((confirmed) => {
            if (confirmed) {
              this.router.navigate(['/records']);
              this.snackBar.open('Record Created successfully!', 'Close', {
                duration: 3000,
              });
            }
          });
      },
      error: (err) => {
        this.dialogService.alert(
          'Error',
          `Failed to ${this.isEditing ? 'update' : 'save'} record: ${
            err.message
          }`
        );
      },
    });
  }

  public cancelEdit() {
    this.router.navigate(['/records']);
  }
}
