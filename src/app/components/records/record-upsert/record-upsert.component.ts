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
  filteredCategories: Category[] = [];
  transactionTypes = ['income', 'expense', 'transfer'];
  recordId: string | null = null;
  isEditing: boolean = false;
  isSubmitting: boolean = false;

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
    console.log('Record ID from route:', this.recordId);

    if (this.recordId) {
      this.isEditing = true;
    }

    // Setup the type watcher first
    this.setupTypeWatcher();

    // Load data
    this.loadAccounts();
    this.loadCategories().then(() => {
      // After categories are loaded, load record for edit if needed
      if (this.recordId) {
        this.loadRecordForEdit(this.recordId);
      }
    });
  }

  public loadAccounts() {
    this.accountService.getAccounts(1, 100, 'name').subscribe({
      next: (data) => {
        this.accounts = data.accounts || [];
        console.log('Accounts loaded:', this.accounts);
      },
      error: (err) => console.error('Failed to load accounts', err),
    });
  }

  public loadCategories(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Make sure we're getting all categories without any type filter
      this.categoryService.getCategories(1, 100, 'name', 'All').subscribe({
        next: (data) => {
          this.categories = data.categories || [];
          console.log('=== CATEGORY DEBUG INFO ===');
          console.log('All categories loaded:', this.categories);
          console.log('Number of categories:', this.categories.length);

          // Log each category's details
          this.categories.forEach((cat, index) => {
            console.log(`Category ${index + 1}:`, {
              id: cat.id,
              name: cat.name,
              type: cat.type,
              description: cat.description,
            });
          });

          // Check what types we have
          const types = this.categories.map((cat) => cat.type);
          const uniqueTypes = [...new Set(types)];
          console.log('Unique category types found:', uniqueTypes);

          // Initialize filtered categories based on current form type
          const currentType = this.recordForm.get('type')?.value;
          console.log('Current form type:', currentType);
          this.filterCategories(currentType);

          resolve();
        },
        error: (err) => {
          console.error('Failed to load categories', err);
          reject(err);
        },
      });
    });
  }

  public onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      const isoDate = `${input.value}:00Z`;
      this.recordForm.get('date')?.setValue(isoDate);
    }
  }

  private filterCategories(
    type: 'income' | 'expense' | 'transfer' | null | undefined
  ) {
    if (type === undefined) {
      // Handle undefined case - maybe show all categories or use a default
      return;
    }
    console.log('=== FILTERING CATEGORIES ===');
    console.log('Requested type:', type);
    console.log('Available categories before filtering:', this.categories);

    if (type === 'transfer') {
      this.filteredCategories = [];
      console.log('Transfer type - no categories needed');
    } else if (type === 'income' || type === 'expense') {
      // Filter categories that match the exact type
      this.filteredCategories = this.categories.filter((category) => {
        const matches = category.type === type;
        console.log(
          `Category "${category.name}" (type: "${category.type}") matches "${type}": ${matches}`
        );
        return matches;
      });
      console.log(`Filtered categories for ${type}:`, this.filteredCategories);
      console.log(
        `Found ${this.filteredCategories.length} categories for type "${type}"`
      );
    } else {
      this.filteredCategories = [];
      console.log('No valid type provided - clearing categories');
    }

    // Reset categoryId if the current selection is no longer valid
    const currentCategoryId = this.recordForm.get('categoryId')?.value;
    if (
      currentCategoryId &&
      !this.filteredCategories.some((cat) => cat.id === currentCategoryId)
    ) {
      console.log(
        'Resetting categoryId as current selection is no longer valid'
      );
      this.recordForm.get('categoryId')?.setValue(null);
    }

    console.log('Final filteredCategories:', this.filteredCategories);
    console.log('=== END FILTERING ===');
  }

  public setupTypeWatcher() {
    this.recordForm.get('type')?.valueChanges.subscribe((type) => {
      console.log('Transaction type changed to:', type);
      const toAccount = this.recordForm.get('toAccountId');
      const category = this.recordForm.get('categoryId');

      // Filter categories based on type
      this.filterCategories(type);

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
      next: (record) => {
        console.log('Loaded record for editing:', record);
        const dateValue = record.date.includes('T')
          ? record.date
          : `${record.date}T00:00:00Z`;

        // Set form values
        this.recordForm.patchValue({
          type: record.type,
          fromAccountId: record.fromAccountId,
          toAccountId: record.toAccountId ?? null,
          categoryId: record.categoryId ?? null,
          description: record.description,
          amount: record.amount,
          date: dateValue,
        });

        // Trigger filtering after setting the type
        this.filterCategories(record.type);
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
    this.isSubmitting = true;
    const formValue = this.recordForm.getRawValue();
    const type = formValue.type as 'income' | 'expense' | 'transfer';

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
      this.isSubmitting = false;
      return;
    }

    const record: Record = {
      id: this.recordId || undefined,
      type,
      fromAccountId: formValue.fromAccountId,
      toAccountId: type === 'transfer' ? formValue.toAccountId! : undefined,
      categoryId: type !== 'transfer' ? formValue.categoryId! : '0',
      description: formValue.description,
      amount: formValue.amount,
      date: formValue.date,
    };
    console.log('Submitting record:', record);

    this.dialogService
      .confirm(
        'Confirmation',
        `Are you sure you want to ${
          this.isEditing ? 'update' : 'save'
        } this record?`
      )
      .then((confirmed) => {
        if (confirmed) {
          const request =
            this.isEditing && this.recordId
              ? this.recordService.updateRecord(record)
              : this.recordService.createRecord(record);

          request.subscribe({
            next: () => {
              this.isSubmitting = false;
              this.router.navigate(['/records']);
              this.snackBar.open('Record saved successfully!', 'Close', {
                duration: 3000,
              });
            },
            error: (err) => {
              this.isSubmitting = false;
              this.dialogService.alert(
                'Error',
                `Failed to ${this.isEditing ? 'update' : 'save'} record: ${
                  err.message
                }`
              );
            },
          });
        } else {
          this.isSubmitting = false;
        }
      });
  }

  public cancelEdit() {
    this.recordForm.reset({
      type: 'expense',
      fromAccountId: null,
      toAccountId: null,
      categoryId: null,
      description: '',
      amount: null,
      date: new Date().toISOString(),
    });
  }
}
