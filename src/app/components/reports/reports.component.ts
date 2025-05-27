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
import { Chart, registerables } from 'chart.js';
import { debounceTime } from 'rxjs/operators';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DatePipe } from '@angular/common';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';

interface ReportSummary {
  date: string;
  income: number;
  expense: number;
  transfer: number;
  net: number;
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
  providers: [DatePipe],
})
export class ReportsComponent implements OnInit, AfterViewInit {
  reportForm: FormGroup;
  categories: CategoryOption[] = [
    { value: 'all', label: 'All' },
    { value: 'transfer', label: 'Transfer' },
  ];
  accounts: Accounts[] = [];
  records: Record[] = [];
  reportType: 'daily' | 'weekly' | 'monthly' | 'custom' = 'weekly'; // Default to weekly for more data
  customDateRange: { start: Date | null; end: Date | null } = {
    start: null,
    end: null,
  };
  summaries: ReportSummary[] = [];
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
    Chart.register(...registerables);
    this.reportForm = this.fb.group({
      accountId: ['all'],
      categoryId: ['all'],
      type: ['all'],
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
    this.renderSummaryChart();
  }

  private loadData(): void {
    this.loading = true;
    // Load categories
    this.categoryService.getCategories(1, 100, 'name', 'All').subscribe({
      next: ({ categories }) => {
        this.categories = [
          { value: 'all', label: 'All' },
          { value: 'transfer', label: 'Transfer' },
          ...categories.map((cat) => ({
            value: cat.id!,
            label: cat.name,
            type: cat.type.toLowerCase() as 'income' | 'expense' | 'transfer',
          })),
        ];
        console.log('Loaded categories:', this.categories);
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
        console.log('Loaded accounts:', this.accounts);
        this.loadReports();
      },
      error: (err) => {
        console.error('Failed to load accounts', err);
        this.loading = false;
      },
    });

    // Load records
    this.loadReports();
  }

  private loadReports(): void {
    this.loading = true;
    const { type } = this.reportForm.value;
    this.recordService.getRecordsDashBoard(1, 100, 'date', type).subscribe({
      next: ({ records }) => {
        console.log('Fetched records:', records);
        this.records = records;
        this.summaries = this.generateSummaries(this.filterRecords(records));
        console.log('Generated summaries:', this.summaries);
        this.renderSummaryChart();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load records', err);
        this.loading = false;
      },
    });
  }

  private filterRecords(records: Record[]): Record[] {
    const { accountId, categoryId } = this.reportForm.value;
    let filtered = records;

    if (accountId !== 'all') {
      filtered = filtered.filter(
        (r) => r.fromAccountId === accountId || r.toAccountId === accountId
      );
    }

    if (categoryId !== 'all') {
      if (categoryId === 'transfer') {
        filtered = filtered.filter((r) => r.type === 'transfer');
      } else {
        filtered = filtered.filter(
          (r) => r.categoryId === categoryId && r.categoryId !== '0'
        );
      }
    }

    if (this.reportType === 'daily') {
      const today = this.datePipe.transform(new Date(), 'yyyy-MM-dd')!;
      filtered = filtered.filter(
        (r) => this.datePipe.transform(r.date, 'yyyy-MM-dd') === today
      );
    } else if (this.reportType === 'weekly') {
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

    console.log('Filtered records:', filtered);
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

  private generateSummaries(records: Record[]): ReportSummary[] {
    const summaries: { [key: string]: ReportSummary } = {};

    records.forEach((record) => {
      let key: string;
      if (this.reportType === 'daily') {
        key = this.datePipe.transform(record.date, 'yyyy-MM-dd')!;
      } else if (this.reportType === 'weekly') {
        const date = new Date(record.date);
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        key = this.datePipe.transform(startOfWeek, 'yyyy-MM-dd')!;
      } else {
        key = this.datePipe.transform(record.date, 'yyyy-MM')!;
      }

      if (!summaries[key]) {
        summaries[key] = {
          date: key,
          income: 0,
          expense: 0,
          transfer: 0,
          net: 0,
        };
      }

      if (record.type === 'income') {
        summaries[key].income += record.amount;
      } else if (record.type === 'expense') {
        summaries[key].expense += record.amount;
      } else {
        summaries[key].transfer += record.amount;
      }
      summaries[key].net = summaries[key].income - summaries[key].expense;
    });

    return Object.values(summaries).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }

  private renderSummaryChart(): void {
    console.log('Rendering chart with summaries:', this.summaries);
    const ctx = document.getElementById('reportChart') as HTMLCanvasElement;
    if (!ctx) {
      console.error('Canvas element with ID "reportChart" not found');
      return;
    }

    if (this.summaries.length === 0) {
      console.warn('No data available for chart');
      return;
    }

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.summaries.map((s) => s.date),
        datasets: [
          {
            label: 'Income',
            data: this.summaries.map((s) => s.income),
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 1,
          },
          {
            label: 'Expense',
            data: this.summaries.map((s) => s.expense),
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderColor: 'rgba(239, 68, 68, 1)',
            borderWidth: 1,
          },
          {
            label: 'Transfer',
            data: this.summaries.map((s) => s.transfer),
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
          },
          {
            label: 'Net',
            data: this.summaries.map((s) => s.net),
            backgroundColor: 'rgba(255, 206, 86, 0.8)',
            borderColor: 'rgba(255, 206, 86, 1)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Amount ($)' },
          },
          x: {
            title: {
              display: true,
              text:
                this.reportType === 'daily'
                  ? 'Date'
                  : this.reportType === 'weekly'
                  ? 'Week Starting'
                  : 'Month',
            },
          },
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { font: { size: 12, family: 'Inter' } },
          },
        },
      },
    });
  }

  setReportType(type: 'daily' | 'weekly' | 'monthly' | 'custom'): void {
    this.reportType = type;
    this.reportForm.patchValue({ reportType: type });
    console.log('Report type set to:', type);
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
      `Financial Report - ${
        this.reportType.charAt(0).toUpperCase() + this.reportType.slice(1)
      }`,
      10,
      10
    );
    autoTable(doc, {
      head: [['Date', 'Income', 'Expense', 'Transfer', 'Net']],
      body: this.summaries.map((s) => [
        s.date,
        s.income.toFixed(2),
        s.expense.toFixed(2),
        s.transfer.toFixed(2),
        s.net.toFixed(2),
      ]),
      startY: 20,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [16, 185, 129] },
    });
    doc.save(
      `report-${this.reportType}-${new Date().toISOString().split('T')[0]}.pdf`
    );
  }

  private updateTimestamp(): void {
    this.lastUpdated = new Date().toLocaleTimeString();
  }
}
