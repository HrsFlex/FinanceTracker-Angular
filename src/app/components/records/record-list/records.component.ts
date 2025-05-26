import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import {
  Accounts,
  Category,
  CategoryOption,
  DisplayRecord,
  Record,
} from '../entity/record-interface';
import { RecordService } from 'src/app/services/record.service';
import { AccountServiceService } from 'src/app/services/account-service.service';
import { CategoryService } from 'src/app/services/category-service.service';
import { Router } from '@angular/router';
import { DialogService } from 'src/app/services/dialog.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-records',
  templateUrl: './records.component.html',
  styleUrls: ['./records.component.css'],
})
export class RecordsComponent implements OnInit {
  displayRecords: DisplayRecord[] = [];
  private accounts: Accounts[] = [];
  private categories: Category[] = [];
  categoryOptions: CategoryOption[] = [{ value: 'all', label: 'All' }]; // Initialize with 'All'
  selectedCategory: string = 'all'; // Default to show all records
  sortField: string = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';

  sortOptions = [
    { field: 'date', label: 'Date' },
    { field: 'amount', label: 'Amount' },
    { field: 'type', label: 'Type' },
  ];

  constructor(
    private recordService: RecordService,
    private accountService: AccountServiceService,
    private categoryService: CategoryService,
    private router: Router,
    private dialogService: DialogService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadRecords();
  }

  loadRecords() {
    forkJoin([
      this.accountService.getAllAccounts(), // Fetch all accounts, including deleted
      this.categoryService.getCategories(1, 100, 'name'),
      this.recordService.getRecords(this.sortField, this.sortOrder),
    ]).subscribe({
      next: ([accounts, categoriesData, records]) => {
        this.accounts = (accounts || []).filter(
          (account) => !account.isDeleted
        );
        this.categories = categoriesData.categories || [];

        // Update category options
        this.categoryOptions = [
          { value: 'all', label: 'All' },
          ...this.categories.map((cat) => ({
            value: String(cat.id),
            label: cat.name,
          })),
          { value: 'transfer', label: 'Transfer' },
        ];

        // Filter records first using original Record objects
        let filteredRecords = records;
        if (this.selectedCategory !== 'all') {
          filteredRecords = records.filter((record) => {
            if (this.selectedCategory === 'transfer') {
              return record.type === 'transfer';
            }
            return (
              record.type !== 'transfer' &&
              String(record.categoryId) === this.selectedCategory
            );
          });
        }

        // Map to DisplayRecord
        this.displayRecords = filteredRecords.map((record) => {
          let formattedDate = 'Invalid Date';
          let sortDate = record.date;
          if (record.date) {
            sortDate = record.date.includes('T')
              ? record.date
              : `${record.date}T00:00:00Z`;
            const date = new Date(record.date);
            if (!isNaN(date.getTime())) {
              formattedDate = date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: 'Asia/Kolkata',
              });
            }
          }

          return {
            id: record.id,
            type: record.type,
            fromAccount:
              this.accounts.find((a) => a.id === String(record.fromAccountId))
                ?.name || 'Deleted Account',
            toAccount: record.toAccountId
              ? this.accounts.find((a) => a.id === String(record.toAccountId))
                  ?.name || 'Deleted Account'
              : undefined,
            categoryId: Number(record.categoryId),
            category:
              record.type !== 'transfer'
                ? this.categories.find(
                    (c) => c.id === String(record.categoryId)
                  )?.name || 'Unknown'
                : 'Transfer',
            description: record.description || 'No description',
            amount: record.amount,
            date: formattedDate,
            sortDate,
          };
        });
        this.displayRecords.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          if (dateA === dateB) {
            // Secondary sort by id
            return this.sortOrder === 'desc'
              ? (b.id || '').localeCompare(a.id || '')
              : (a.id || '').localeCompare(b.id || '');
          }
          return this.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });
      },
      error: (err) => {
        console.error('Failed to load records', err);
        this.snackBar.open('Failed to load records: ' + err.message, 'Close', {
          duration: 5000,
        });
      },
    });
  }
  onCategoryChange() {
    this.loadRecords();
  }

  sortBy(field: string) {
    if (this.sortField === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortOrder = field === 'date' ? 'desc' : 'asc';
    }
    this.loadRecords();
  }

  editRecord(id?: string) {
    if (id) {
      console.log('Navigating to edit record:', id); // Debug
      this.router.navigate(['/record-upsert', id]);
    }
  }

  async deleteRecord(id?: string) {
    if (!id) return;

    const confirmed = await this.dialogService.confirm(
      'Delete Record?',
      'Are you sure you want to delete this record? This will revert the account balances.'
    );

    if (!confirmed) return;

    this.recordService.deleteRecord(id.toString()).subscribe({
      next: () => {
        this.displayRecords = this.displayRecords.filter(
          (record) => record.id !== id
        );
        this.snackBar.open('Record deleted successfully!', 'Close', {
          duration: 3000,
        });
      },
      error: (err) => {
        this.snackBar.open('Error deleting record: ' + err.message, 'Close', {
          duration: 5000,
        });
      },
    });
  }
}
