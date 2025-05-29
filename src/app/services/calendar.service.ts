import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { environment } from 'src/enviroments/environment';
import {
  Accounts,
  Category,
  DisplayRecord,
  Record,
} from '../components/records/entity/record-interface';

export interface CalendarDay {
  date: Date;
  dateString: string; // YYYY-MM-DD format
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  transactions: DisplayRecord[];
  totalIncome: number;
  totalExpense: number;
  transactionCount: number;
}

export interface MonthlyTransactionData {
  year: number;
  month: number;
  days: CalendarDay[];
  totalIncome: number;
  totalExpense: number;
  totalTransactions: number;
}

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  private apiUrl = environment.baseUrl + '/records';
  private accountsUrl = environment.baseUrl + '/accounts';
  private categoriesUrl = environment.baseUrl + '/categories';

  constructor(private http: HttpClient) {}

  /**
   * Get all transactions for a specific month and convert them to DisplayRecord format
   */
  getMonthlyTransactions(
    year: number,
    month: number
  ): Observable<DisplayRecord[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    return this.http.get<Record[]>(this.apiUrl).pipe(
      map((records) =>
        records.filter((record) => {
          const recordDate = record.date.split('T')[0];
          return recordDate >= startStr && recordDate <= endStr;
        })
      ),
      switchMap((filteredRecords) => {
        if (filteredRecords.length === 0) {
          return of([]);
        }

        // Get all unique account IDs and category IDs
        const accountIds = new Set<string>();
        const categoryIds = new Set<string>();

        filteredRecords.forEach((record) => {
          accountIds.add(record.fromAccountId);
          if (record.toAccountId) {
            accountIds.add(record.toAccountId);
          }
          if (record.categoryId) {
            categoryIds.add(record.categoryId);
          }
        });

        // Fetch all accounts and categories
        const accounts$ = this.getAccountsByIds(Array.from(accountIds));
        const categories$ =
          categoryIds.size > 0
            ? this.getCategoriesByIds(Array.from(categoryIds))
            : of([] as Category[]);

        return forkJoin({
          accounts: accounts$,
          categories: categories$,
        }).pipe(
          map(({ accounts, categories }) => {
            // Create lookup maps
            const accountMap = new Map(accounts.map((acc) => [acc.id!, acc]));
            const categoryMap = new Map(
              categories.map((cat) => [cat.id!, cat])
            );

            // Convert records to DisplayRecord format
            return filteredRecords.map((record) =>
              this.convertToDisplayRecord(record, accountMap, categoryMap)
            );
          })
        );
      }),
      catchError((error) => {
        console.error('Error fetching monthly transactions:', error);
        return of([]);
      })
    );
  }

  /**
   * Get transactions for a specific date
   */
  getTransactionsForDate(date: Date): Observable<DisplayRecord[]> {
    const dateStr = date.toISOString().split('T')[0];

    return this.http.get<Record[]>(this.apiUrl).pipe(
      map((records) =>
        records.filter((record) => {
          const recordDate = record.date.split('T')[0];
          return recordDate === dateStr;
        })
      ),
      switchMap((filteredRecords) => {
        if (filteredRecords.length === 0) {
          return of([]);
        }

        const accountIds = new Set<string>();
        const categoryIds = new Set<string>();

        filteredRecords.forEach((record) => {
          accountIds.add(record.fromAccountId);
          if (record.toAccountId) {
            accountIds.add(record.toAccountId);
          }
          if (record.categoryId) {
            categoryIds.add(record.categoryId);
          }
        });

        const accounts$ = this.getAccountsByIds(Array.from(accountIds));
        const categories$ =
          categoryIds.size > 0
            ? this.getCategoriesByIds(Array.from(categoryIds))
            : of([] as Category[]);

        return forkJoin({
          accounts: accounts$,
          categories: categories$,
        }).pipe(
          map(({ accounts, categories }) => {
            const accountMap = new Map(accounts.map((acc) => [acc.id!, acc]));
            const categoryMap = new Map(
              categories.map((cat) => [cat.id!, cat])
            );

            return filteredRecords
              .map((record) =>
                this.convertToDisplayRecord(record, accountMap, categoryMap)
              )
              .sort(
                (a, b) =>
                  new Date(b.sortDate).getTime() -
                  new Date(a.sortDate).getTime()
              );
          })
        );
      }),
      catchError((error) => {
        console.error('Error fetching transactions for date:', error);
        return of([]);
      })
    );
  }

  /**
   * Generate calendar days for a given month
   */
  generateCalendarDays(year: number, month: number): CalendarDay[] {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    // Start from the beginning of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // End at the end of the week containing the last day
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const today = new Date();
    const days: CalendarDay[] = [];

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const isCurrentMonth = currentDate.getMonth() === month - 1;
      const isToday = this.isSameDate(currentDate, today);

      days.push({
        date: new Date(currentDate),
        dateString: this.formatDateString(currentDate),
        isCurrentMonth,
        isToday,
        isSelected: false,
        transactions: [],
        totalIncome: 0,
        totalExpense: 0,
        transactionCount: 0,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }

  /**
   * Process transactions and assign them to calendar days
   */
  processTransactionsForCalendar(
    days: CalendarDay[],
    transactions: DisplayRecord[]
  ): CalendarDay[] {
    // Reset all days
    days.forEach((day) => {
      day.transactions = [];
      day.totalIncome = 0;
      day.totalExpense = 0;
      day.transactionCount = 0;
    });

    // Group transactions by date
    transactions.forEach((transaction) => {
      const transactionDate = new Date(transaction.sortDate);
      const day = days.find((d) => this.isSameDate(d.date, transactionDate));

      if (day) {
        day.transactions.push(transaction);
        day.transactionCount++;

        if (transaction.type === 'income') {
          day.totalIncome += transaction.amount;
        } else if (transaction.type === 'expense') {
          day.totalExpense += transaction.amount;
        }
      }
    });

    // Sort transactions within each day by time (newest first)
    days.forEach((day) => {
      day.transactions.sort(
        (a, b) =>
          new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime()
      );
    });

    return days;
  }

  private getAccountsByIds(ids: string[]): Observable<Accounts[]> {
    if (ids.length === 0) {
      return of([]);
    }

    const requests = ids.map((id) =>
      this.http
        .get<Accounts>(`${this.accountsUrl}/${id}`)
        .pipe(catchError(() => of(null)))
    );

    return forkJoin(requests).pipe(
      map((accounts) => accounts.filter((acc) => acc !== null) as Accounts[])
    );
  }

  private getCategoriesByIds(ids: string[]): Observable<Category[]> {
    if (ids.length === 0) {
      return of([]);
    }

    return this.http
      .get<Category[]>(`${this.categoriesUrl}`)
      .pipe(
        map((categories) => categories.filter((cat) => ids.includes(cat.id!)))
      );
  }

  private convertToDisplayRecord(
    record: Record,
    accountMap: Map<string, Accounts>,
    categoryMap: Map<string, Category>
  ): DisplayRecord {
    const fromAccount = accountMap.get(record.fromAccountId);
    const toAccount = record.toAccountId
      ? accountMap.get(record.toAccountId)
      : undefined;
    const category = record.categoryId
      ? categoryMap.get(record.categoryId)
      : undefined;

    // Parse the date and format it
    const recordDate = new Date(record.date);
    const formattedDate = recordDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return {
      id: record.id,
      type: record.type,
      fromAccount: fromAccount?.name || 'Unknown Account',
      toAccount: toAccount?.name,
      categoryId: category?.id ? Number(category.id) : undefined,
      category: category?.name,
      description: record.description,
      amount: record.amount,
      date: formattedDate,
      sortDate: record.date,
    };
  }

  private isSameDate(date1: Date, date2: Date): boolean {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  }

  private formatDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
