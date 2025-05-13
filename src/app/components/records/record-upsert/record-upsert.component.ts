import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Accounts, Category, Record } from '../entity/record-interface';
import { AccountServiceService } from 'src/app/services/account-service.service';
import { CategoryService } from 'src/app/services/category-service.service';
import { RecordService } from 'src/app/services/record.service';
// import { AccountServiceService } from '../services/account-service.service';
// import { CategoryService } from '../services/category.service';
// import { RecordService } from '../services/record.service';
// import { Accounts, Category, Record } from '../interfaces/record.interface';

@Component({
  selector: 'app-record-upsert',
  templateUrl: './record-upsert.component.html',
  styleUrls: ['./record-upsert.component.css'],
})
export class RecordUpsertComponent implements OnInit {
  recordForm!: FormGroup;
  accounts: Accounts[] = [];
  categories: Category[] = [];
  transactionTypes = ['income', 'expense', 'transfer'];

  constructor(
    private fb: FormBuilder,
    private accountService: AccountServiceService,
    private categoryService: CategoryService,
    private recordService: RecordService
  ) {}

  ngOnInit(): void {
    this.recordForm = this.fb.group({
      type: ['income', Validators.required],
      fromAccountId: [null, Validators.required],
      toAccountId: [null],
      categoryId: [null, Validators.required],
      description: [''],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      date: [new Date().toISOString().split('T')[0], Validators.required],
    });

    this.loadAccounts();
    this.loadCategories();
    this.setupTypeWatcher();
  }

  loadAccounts() {
    this.accountService.getAccounts(1, 100, 'name').subscribe({
      next: (data) => (this.accounts = data.accounts || []),
      error: (err) => console.error('Failed to load accounts', err),
    });
  }

  loadCategories() {
    this.categoryService.getCategories(1, 100, 'name').subscribe({
      next: (data) => (this.categories = data.categories || []),
      error: (err) => console.error('Failed to load categories', err),
    });
  }

  setupTypeWatcher() {
    this.recordForm.get('type')?.valueChanges.subscribe((type: string) => {
      const toAccount = this.recordForm.get('toAccountId');
      const category = this.recordForm.get('categoryId');

      if (type === 'transfer') {
        toAccount?.setValidators([Validators.required]);
        category?.clearValidators();
      } else {
        toAccount?.clearValidators();
        category?.setValidators([Validators.required]);
      }

      toAccount?.updateValueAndValidity();
      category?.updateValueAndValidity();
    });
  }

  submitForm() {
    if (this.recordForm.invalid) {
      this.recordForm.markAllAsTouched();
      return;
    }

    const record: Record = this.recordForm.value;
    this.recordService.createRecord(record).subscribe({
      next: () => {
        alert('Record saved successfully!');
        this.recordForm.reset({
          type: 'income',
          fromAccountId: null,
          toAccountId: null,
          categoryId: null,
          description: '',
          amount: null,
          date: new Date().toISOString().split('T')[0],
        });
      },
      error: (err) => {
        console.error('Failed to save record', err);
        alert('Failed to save record');
      },
    });
  }
}
