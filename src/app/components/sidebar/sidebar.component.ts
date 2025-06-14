import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AccountServiceService } from 'src/app/services/account-service.service';
import { CategoryService } from 'src/app/services/category-service.service';
import { RecordService } from 'src/app/services/record.service';
import { Accounts, Category, Record } from '../records/entity/record-interface';
import { debounceTime } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit, AfterViewInit {
  categories: Category[] = [];
  accounts: Accounts[] = [];
  records: Record[] = [];
  typeFilter: 'all' | 'income' | 'expense' | 'transfer' = 'all';
  totalIncome: number = 0;
  totalExpense: number = 0;
  totalBalance: number = 0;
  displayedRecords: {
    record: Record;
    accountName: string;
    categoryName: string;
  }[] = [];
  lastUpdated: string = new Date().toLocaleTimeString();
  constructor(
    private categoryService: CategoryService,
    private accountService: AccountServiceService,
    private recordService: RecordService,
    private router: Router
  ) {}
  isCollapsed = false;
  ngOnInit(): void {
    this.loadData();
    this.categoryService
      .onCategoryChanged()
      .pipe(debounceTime(100))
      .subscribe(() => this.loadData());
    // Update timestamp every minute
    // setInterval(() => this.updateTimestamp(), 60000);
  }

  ngAfterViewInit(): void {
    // this.renderCategoryChart();
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }
  private loadData(): void {
    // Load categories
    this.categoryService.getCategories(1, 100, 'name', 'All').subscribe({
      next: ({ categories }) => {
        this.categories = categories.map((cat) => ({
          ...cat,
          type: cat.type.toLowerCase() as 'income' | 'expense' | 'transfer',
        }));
        this.updateDisplayedRecords();
      },
      error: (err) => console.error('Failed to load categories', err),
    });

    // Load accounts
    this.accountService.getAccounts(1, 100, 'name').subscribe({
      next: ({ accounts }) => {
        this.accounts = accounts.filter((acc) => !acc.isDeleted);
        this.totalBalance = this.accounts.reduce(
          (sum, acc) => sum + acc.balance,
          0
        );
        this.updateDisplayedRecords();
      },
      error: (err) => console.error('Failed to load accounts', err),
    });

    // Load records
    this.recordService
      .getRecordsDashBoard(1, 100, 'date', this.typeFilter)
      .subscribe({
        next: ({ records }) => {
          this.records = records;
          this.calculateTotals();
          this.updateDisplayedRecords();
        },
        error: (err) => console.error('Failed to load records', err),
      });
  }
  private calculateTotals(): void {
    this.totalIncome = this.records
      .filter((rec) => rec.type === 'income')
      .reduce((sum, rec) => sum + rec.amount, 0);
    this.totalExpense = this.records
      .filter((rec) => rec.type === 'expense')
      .reduce((sum, rec) => sum + rec.amount, 0);
  }

  private updateDisplayedRecords(): void {
    this.displayedRecords = this.records.map((record) => ({
      record,
      accountName:
        this.accounts.find((acc) => acc.id === record.fromAccountId)?.name ||
        'Unknown',
      categoryName: record.categoryId
        ? this.categories.find((cat) => cat.id === record.categoryId)?.name ||
          'Unknown'
        : 'N/A',
    }));
  }
}
