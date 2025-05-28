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
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
})
export class CalendarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  currentDate = new Date();
  calendarDays: CalendarDay[] = [];
  selectedDay: CalendarDay | null = null;
  isLoading = false;

  dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Monthly summary data
  monthlyData: MonthlyTransactionData = {
    year: 0,
    month: 0,
    days: [],
    totalIncome: 0,
    totalExpense: 0,
    totalTransactions: 0,
  };

  constructor(
    private calendarService: CalendarService,
    private recordService: RecordService
  ) {}

  ngOnInit() {
    this.initializeCalendar();

    // Listen for record updates from your existing service
    this.recordService.recordUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadTransactionsForMonth();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize calendar with current month
   */
  initializeCalendar() {
    this.generateCalendar();
    this.loadTransactionsForMonth();
  }

  /**
   * Generate calendar structure for current month
   */
  generateCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth() + 1; // Convert to 1-based month

    this.calendarDays = this.calendarService.generateCalendarDays(year, month);
    this.monthlyData.year = year;
    this.monthlyData.month = month;
  }

  /**
   * Load transactions for the current month
   */
  loadTransactionsForMonth() {
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
  selectDate(day: CalendarDay) {
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
  previousMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.selectedDay = null;
    this.initializeCalendar();
  }

  /**
   * Navigate to next month
   */
  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.selectedDay = null;
    this.initializeCalendar();
  }

  /**
   * Go to current month (today)
   */
  goToToday() {
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
  isCurrentMonthToday(): boolean {
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
  trackByDate(index: number, day: CalendarDay): string {
    return day.dateString;
  }

  /**
   * Track by function for transactions
   */
  trackByTransactionId(index: number, transaction: DisplayRecord): string {
    return transaction.id || index.toString();
  }

  /**
   * Get transaction type icon
   */
  getTransactionIcon(type: string): string {
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
  getTransactionClass(type: string): string {
    return `transaction-${type}`;
  }
}
