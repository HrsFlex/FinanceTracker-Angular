import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RecordService } from '../../services/record.service';
import { DisplayRecord } from '../records/entity/record-interface';
import {
  CalendarDay,
  CalendarService,
  MonthlyTransactionData,
} from 'src/app/services/calendar.service';
import { Router } from '@angular/router';
import { DialogService } from 'src/app/services/dialog.service';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
})
export class CalendarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  public currentDate = new Date();
  public calendarDays: CalendarDay[] = [];
  public selectedDay: CalendarDay | null = null;
  public isLoading = false;

  public dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Monthly summary data
  public monthlyData: MonthlyTransactionData = {
    year: 0,
    month: 0,
    days: [],
    totalIncome: 0,
    totalExpense: 0,
    totalTransactions: 0,
  };

  constructor(
    private calendarService: CalendarService,
    private recordService: RecordService,
    private router: Router,
    public dialogService: DialogService
  ) {}

  public ngOnInit() {
    this.initializeCalendar();

    // Listen for record updates from your existing service
    this.recordService.recordUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadTransactionsForMonth();
      });
  }

  public ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize calendar with current month
   */
  public initializeCalendar() {
    this.generateCalendar();
    this.loadTransactionsForMonth();
  }

  /**
   * Generate calendar structure for current month
   */
  public generateCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth() + 1; // Convert to 1-based month

    this.calendarDays = this.calendarService.generateCalendarDays(year, month);
    this.monthlyData.year = year;
    this.monthlyData.month = month;
  }

  /**
   * Navigate to record-upsert component with transaction ID for editing
   */
  public editTransaction(transactionId: string | undefined) {
    if (transactionId) {
      this.router.navigate(['/record-upsert', transactionId]);
    }
  }

  /**
   * Delete a transaction and refresh the calendar
   */
  async deleteTransaction(transactionId: string | undefined) {
    if (!transactionId) return;

    const confirmed = await this.dialogService.confirm(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?'
    );

    if (!confirmed) return;

    this.isLoading = true;
    this.recordService.deleteRecord(transactionId).subscribe({
      next: () => {
        this.isLoading = false;
        this.loadTransactionsForMonth(); // Reload calendar data after deletion
      },
      error: (error) => {
        console.error('Error deleting transaction:', error);
        this.isLoading = false;
        this.dialogService.alert(
          'Error',
          'Failed to delete transaction. Please try again.'
        );
      },
    });
  }

  /**
   * Load transactions for the current month
   */
  public loadTransactionsForMonth() {
    this.isLoading = true;
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth() + 1;

    this.calendarService
      .getMonthlyTransactions(year, month)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (transactions) => {
          this.processTransactions(transactions);
          this.calculateMonthlySummary();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading monthly transactions:', error);
          this.isLoading = false;
        },
      });
  }

  /**
   * Process transactions and assign to calendar days
   */
  private processTransactions(transactions: DisplayRecord[]) {
    this.calendarDays = this.calendarService.processTransactionsForCalendar(
      this.calendarDays,
      transactions
    );
  }

  /**
   * Calculate monthly summary statistics
   */
  private calculateMonthlySummary() {
    this.monthlyData.totalIncome = 0;
    this.monthlyData.totalExpense = 0;
    this.monthlyData.totalTransactions = 0;

    this.calendarDays
      .filter((day) => day.isCurrentMonth)
      .forEach((day) => {
        this.monthlyData.totalIncome += day.totalIncome;
        this.monthlyData.totalExpense += day.totalExpense;
        this.monthlyData.totalTransactions += day.transactionCount;
      });

    this.monthlyData.days = this.calendarDays;
  }

  /**
   * Handle date selection
   */
  public selectDate(day: CalendarDay) {
    // Reset previous selection
    this.calendarDays.forEach((d) => (d.isSelected = false));

    // Set new selection
    day.isSelected = true;
    this.selectedDay = day;

    // If no transactions are cached for this day, fetch them
    if (day.transactionCount > 0 && day.transactions.length === 0) {
      this.loadTransactionsForDate(day);
    }
  }

  /**
   * Load transactions for a specific date
   */
  private loadTransactionsForDate(day: CalendarDay) {
    this.calendarService
      .getTransactionsForDate(day.date)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (transactions) => {
          day.transactions = transactions;
        },
        error: (error) => {
          console.error('Error loading transactions for date:', error);
        },
      });
  }

  /**
   * Navigate to previous month
   */
  public previousMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.selectedDay = null;
    this.initializeCalendar();
  }

  /**
   * Navigate to next month
   */
  public nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.selectedDay = null;
    this.initializeCalendar();
  }

  /**
   * Go to current month (today)
   */
  public goToToday() {
    this.currentDate = new Date();
    this.selectedDay = null;
    this.initializeCalendar();

    // Auto-select today if it exists in current month
    setTimeout(() => {
      const today = this.calendarDays.find((day) => day.isToday);
      if (today) {
        this.selectDate(today);
      }
    }, 100);
  }

  /**
   * Check if current month is the same as today's month
   */
  public isCurrentMonthToday(): boolean {
    const today = new Date();
    return (
      this.currentDate.getMonth() === today.getMonth() &&
      this.currentDate.getFullYear() === today.getFullYear()
    );
  }

  /**
   * Get formatted month year string
   */
  get currentMonthYear(): string {
    return this.currentDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }

  /**
   * Get net amount for the month
   */
  get monthlyNetAmount(): number {
    return this.monthlyData.totalIncome - this.monthlyData.totalExpense;
  }

  /**
   * Get formatted date for selected day
   */
  get selectedDateFormatted(): string {
    if (!this.selectedDay) return '';

    return this.selectedDay.date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Track by function for calendar days
   */
  public trackByDate(index: number, day: CalendarDay): string {
    return day.dateString;
  }

  /**
   * Track by function for transactions
   */
  public trackByTransactionId(
    index: number,
    transaction: DisplayRecord
  ): string {
    return transaction.id || index.toString();
  }

  /**
   * Get transaction type icon
   */
  public getTransactionIcon(type: string): string {
    switch (type) {
      case 'income':
        return '↗️';
      case 'expense':
        return '↘️';
      case 'transfer':
        return '↔️';
      default:
        return '💰';
    }
  }

  /**
   * Get transaction type class for styling
   */
  public getTransactionClass(type: string): string {
    return `transaction-${type}`;
  }
}
