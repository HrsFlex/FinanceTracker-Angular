import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CategoryService } from 'src/app/services/category-service.service';
import { AccountServiceService } from 'src/app/services/account-service.service';
import { RecordService } from 'src/app/services/record.service';
// import { Category, Accounts, Record } from '../entity/record-interface';
import { Chart, registerables } from 'chart.js';
import { debounceTime } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Accounts, Category, Record } from '../records/entity/record-interface';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, AfterViewInit {
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
  ) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.loadData();
    this.categoryService
      .onCategoryChanged()
      .pipe(debounceTime(100))
      .subscribe(() => this.loadData());
    // Update timestamp every minute
    setInterval(() => this.updateTimestamp(), 60000);
  }

  ngAfterViewInit(): void {
    this.renderCategoryChart();
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
        this.renderCategoryChart();
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

  private renderCategoryChart(): void {
    const ctx = document.getElementById('categoryChart') as HTMLCanvasElement;
    if (!ctx) return;

    const categoryCounts = {
      income: this.categories.filter((cat) => cat.type === 'income').length,
      expense: this.categories.filter((cat) => cat.type === 'expense').length,
      transfer: this.categories.filter((cat) => cat.type === 'transfer').length,
    };

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Income', 'Expense', 'Transfer'],
        datasets: [
          {
            data: [
              categoryCounts.income,
              categoryCounts.expense,
              categoryCounts.transfer,
            ],
            backgroundColor: [
              'rgba(16, 185, 129, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              'rgba(59, 130, 246, 0.8)',
            ],
            borderColor: [
              'rgba(16, 185, 129, 1)',
              'rgba(239, 68, 68, 1)',
              'rgba(59, 130, 246, 1)',
            ],
            borderWidth: 2,
            hoverOffset: 10,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: { size: 12, family: 'Inter' },
            },
          },
        },
        cutout: '60%',
      },
    });
  }

  public filterRecords(type: 'all' | 'income' | 'expense' | 'transfer'): void {
    this.typeFilter = type;
    this.loadData();
  }

  private updateTimestamp(): void {
    this.lastUpdated = new Date().toLocaleTimeString();
  }

  public addAccount(): void {
    this.router.navigate(['/accounts-upsert']); // Adjust route as needed
  }

  public loadMore(): void {
    // Implement pagination if needed
    console.log('Load more transactions');
  }
}
