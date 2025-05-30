import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CategoryService } from 'src/app/services/category-service.service';
import { AccountServiceService } from 'src/app/services/account-service.service';
import { RecordService } from 'src/app/services/record.service';
import {
  Accounts,
  Category,
  Record,
  CategoryOption,
} from '../records/entity/record-interface';
import { Chart } from 'chart.js';
import { debounceTime } from 'rxjs/operators';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DatePipe } from '@angular/common';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';

// Declare jsPDF extension for jspdf-autotable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}

interface CategorySummary {
  category: string;
  amount: number;
  percentage: number;
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
  providers: [DatePipe],
})
export class ReportsComponent implements OnInit, AfterViewInit {
  reportForm: FormGroup;
  categories: CategoryOption[] = [];
  accounts: Accounts[] = [];
  records: Record[] = [];
  reportType: 'weekly' | 'monthly' | 'custom' = 'weekly';
  customDateRange: { start: Date | null; end: Date | null } = {
    start: null,
    end: null,
  };
  categorySummaries: CategorySummary[] = [];
  totalExpenses: number = 0;
  highestCategory: CategoryOption | null = null;
  insights: string[] = [];
  lastUpdated: string = new Date().toLocaleTimeString();
  loading = false;
  chart: Chart | null = null;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private accountService: AccountServiceService,
    private recordService: RecordService,
    private datePipe: DatePipe
  ) {
    this.reportForm = this.fb.group({
      accountId: ['all'],
      reportType: ['weekly'],
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.categoryService
      .onCategoryChanged()
      .pipe(debounceTime(100))
      .subscribe(() => this.loadData());
    setInterval(() => this.updateTimestamp(), 60000);
  }

  ngAfterViewInit(): void {
    this.renderCategoryChart();
  }

  private loadData(): void {
    this.loading = true;
    // Load categories
    this.categoryService.getCategories(1, 100, 'name', 'All').subscribe({
      next: ({ categories }) => {
        this.categories = categories.map((cat) => ({
          value: cat.id!,
          label: cat.name,
          type: cat.type.toLowerCase() as 'income' | 'expense' | 'transfer',
        }));
        this.loadReports();
      },
      error: (err) => {
        console.error('Failed to load categories', err);
        this.loading = false;
      },
    });

    // Load accounts
    this.accountService.getAccounts(1, 100, 'name').subscribe({
      next: ({ accounts }) => {
        this.accounts = [
          { id: 'all', name: 'All Accounts', balance: 0, isDeleted: false },
          ...accounts.filter((acc) => !acc.isDeleted),
        ];
        this.loadReports();
      },
      error: (err) => {
        console.error('Failed to load accounts', err);
        this.loading = false;
      },
    });
  }

  private loadReports(): void {
    this.loading = true;
    this.recordService
      .getRecordsDashBoard(1, 100, 'date', 'expense')
      .subscribe({
        next: ({ records }) => {
          this.records = records;
          this.categorySummaries = this.generateCategorySummaries(
            this.filterRecords(records)
          );
          this.totalExpenses = this.categorySummaries.reduce(
            (sum, s) => sum + s.amount,
            0
          );
          this.highestCategory = this.findHighestCategory();
          this.generateInsights();
          this.renderCategoryChart();
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load records', err);
          this.loading = false;
        },
      });
  }

  private filterRecords(records: Record[]): Record[] {
    const { accountId } = this.reportForm.value;
    let filtered = records.filter((r) => r.type === 'expense');

    if (accountId !== 'all') {
      filtered = filtered.filter(
        (r) => r.fromAccountId === accountId || r.toAccountId === accountId
      );
    }

    if (this.reportType === 'weekly') {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      filtered = this.filterByDateRange(filtered, startOfWeek, endOfWeek);
    } else if (this.reportType === 'monthly') {
      const startOfMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      );
      const endOfMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        0
      );
      filtered = this.filterByDateRange(filtered, startOfMonth, endOfMonth);
    } else if (
      this.reportType === 'custom' &&
      this.customDateRange.start &&
      this.customDateRange.end
    ) {
      filtered = this.filterByDateRange(
        filtered,
        this.customDateRange.start,
        this.customDateRange.end
      );
    }

    return filtered;
  }

  private filterByDateRange(
    records: Record[],
    start: Date,
    end: Date
  ): Record[] {
    return records.filter((r) => {
      const recordDate = new Date(r.date);
      return recordDate >= start && recordDate <= end;
    });
  }

  private generateCategorySummaries(records: Record[]): CategorySummary[] {
    const summaries: { [key: string]: CategorySummary } = {};

    records.forEach((record) => {
      const category =
        this.categories.find((c) => c.value === record.categoryId)?.label ||
        'Uncategorized';
      if (!summaries[category]) {
        summaries[category] = { category, amount: 0, percentage: 0 };
      }
      summaries[category].amount += record.amount;
    });

    const total = Object.values(summaries).reduce(
      (sum, s) => sum + s.amount,
      0
    );
    Object.values(summaries).forEach((s) => {
      s.percentage = total > 0 ? (s.amount / total) * 100 : 0;
    });

    return Object.values(summaries).sort((a, b) => b.amount - a.amount);
  }

  private findHighestCategory(): CategoryOption | null {
    if (this.categorySummaries.length === 0) return null;
    const highest = this.categorySummaries[0];
    return this.categories.find((c) => c.label === highest.category) || null;
  }

  private generateInsights(): void {
    this.insights = [];
    if (this.totalExpenses > 0) {
      const highSpending = this.categorySummaries.filter(
        (s) => s.percentage > 30
      );
      if (highSpending.length > 0) {
        highSpending.forEach((s) => {
          this.insights.push(
            `Category "${s.category}" accounts for ${s.percentage.toFixed(
              1
            )}% of your expenses. Consider reviewing your spending in this area to identify potential savings.`
          );
        });
      } else {
        this.insights.push(
          'Your spending is well-distributed across categories. Keep monitoring to maintain balance.'
        );
      }
      if (this.categorySummaries.length > 5) {
        this.insights.push(
          'You have expenses in multiple categories. Consolidating spending into fewer categories may simplify budgeting.'
        );
      }
    } else {
      this.insights.push(
        'No expense data available for the selected period. Try adjusting the filters.'
      );
    }
  }

  private renderCategoryChart(): void {
    const ctx = document.getElementById('reportChart') as HTMLCanvasElement;
    if (!ctx) {
      console.error('Canvas element with ID "reportChart" not found');
      return;
    }

    if (this.categorySummaries.length === 0) {
      console.warn('No data available for chart');
      return;
    }

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: this.categorySummaries.map((s) => s.category),
        datasets: [
          {
            label: 'Expenses by Category',
            data: this.categorySummaries.map((s) => s.amount),
            backgroundColor: [
              '#10B981', // Emerald
              '#EF4444', // Red
              '#3B82F6', // Blue
              '#F59E0B', // Amber
              '#8B5CF6', // Purple
              '#EC4899', // Pink
              '#6B7280', // Gray
            ],
            borderColor: [
              '#064E3B', // Dark Emerald
              '#991B1B', // Dark Red
              '#1E3A8A', // Dark Blue
              '#B45309', // Dark Amber
              '#5B21B6', // Dark Purple
              '#9D174D', // Dark Pink
              '#4B5563', // Dark Gray
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { font: { size: 12, family: 'Inter' } },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce(
                  (sum, val) => sum + val,
                  0
                );
                const percentage =
                  total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${context.label}: $${value.toFixed(
                  2
                )} (${percentage}%)`;
              },
            },
          },
        },
      },
    });
  }

  setReportType(type: 'weekly' | 'monthly' | 'custom'): void {
    this.reportType = type;
    this.loadReports();
  }

  setCustomDateRange(
    event: MatDatepickerInputEvent<Date>,
    type: 'start' | 'end'
  ): void {
    if (type === 'start') {
      this.customDateRange.start = event.value;
    } else {
      this.customDateRange.end = event.value;
    }
    if (this.reportType === 'custom') {
      this.loadReports();
    }
  }

  downloadPDF(): void {
    const doc = new jsPDF();
    doc.text(
      `Expense Report by Category - ${
        this.reportType.charAt(0).toUpperCase() + this.reportType.slice(1)
      }`,
      10,
      10
    );
    autoTable(doc, {
      head: [['Category', 'Amount', '% of Total']],
      body: this.categorySummaries.map((s) => [
        s.category,
        s.amount.toFixed(2),
        s.percentage.toFixed(1) + '%',
      ]),
      startY: 20,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [16, 185, 129] },
    });
    doc.text('Spending Insights', 10, doc.lastAutoTable.finalY + 10);
    autoTable(doc, {
      body: this.insights.map((insight) => [insight]),
      startY: doc.lastAutoTable.finalY + 20,
      styles: { fontSize: 10 },
    });
    doc.save(
      `expense-report-${this.reportType}-${
        new Date().toISOString().split('T')[0]
      }.pdf`
    );
  }

  private updateTimestamp(): void {
    this.lastUpdated = new Date().toLocaleTimeString();
  }
}
