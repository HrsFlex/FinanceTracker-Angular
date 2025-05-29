import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
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

  // In-memory caches
  private accountsCache = new Map<string, Accounts>();
  private categoriesCache = new Map<string, Category>();
  private accountsFetched = false; // Track if all accounts have been fetched
  private categoriesFetched = false; // Track if all categories have been fetched

  constructor(private http: HttpClient) {
    // Preload accounts and categories on service initialization
    this.preloadAccounts();
    this.preloadCategories();
  }

  /**
   * Preload all accounts to eliminate repeated calls
   */
  private preloadAccounts(): void {
    this.http
      .get<Accounts[]>(this.accountsUrl)
      .pipe(
        map((accounts) => {
          accounts.forEach((acc) => {
            if (acc.id) {
              this.accountsCache.set(acc.id, acc);
            }
          });
          this.accountsFetched = true;
          console.log(
            'preloadAccounts: Cached all accounts:',
            Array.from(this.accountsCache.keys())
          );
        }),
        catchError((error) => {
          console.error('preloadAccounts: Error preloading accounts:', error);
          return of([]);
        })
      )
      .subscribe();
  }

  /**
   * Preload all categories to eliminate repeated calls
   */
  private preloadCategories(): void {
    this.http
      .get<Category[]>(this.categoriesUrl)
      .pipe(
        map((categories) => {
          categories.forEach((cat) => {
            if (cat.id) {
              this.categoriesCache.set(cat.id, cat);
            }
          });
          this.categoriesFetched = true;
          console.log(
            'preloadCategories: Cached all categories:',
            Array.from(this.categoriesCache.keys())
          );
        }),
        catchError((error) => {
          console.error(
            'preloadCategories: Error preloading categories:',
            error
          );
          return of([]);
        })
      )
      .subscribe();
  }

  /**
   * Get all transactions for a specific month and convert them to DisplayRecord format
   */
  getMonthlyTransactions(
    year: number,
    month: number
  ): Observable<DisplayRecord[]> {
    console.log(`getMonthlyTransactions: Fetching for ${year}-${month}`);
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
        console.log(
          `getMonthlyTransactions: Found ${filteredRecords.length} records`
        );
        if (filteredRecords.length === 0) {
          console.log(
            'getMonthlyTransactions: No records, skipping account/category fetch'
          );
          return of([]);
        }

        // Get unique account and category IDs
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

        // Check if all data is pre-fetched
        const missingAccountIds = this.accountsFetched
          ? []
          : Array.from(accountIds).filter((id) => !this.accountsCache.has(id));
        const missingCategoryIds = this.categoriesFetched
          ? []
          : Array.from(categoryIds).filter(
              (id) => !this.categoriesCache.has(id)
            );

        console.log(
          'getMonthlyTransactions: Missing account IDs:',
          missingAccountIds
        );
        console.log(
          'getMonthlyTransactions: Missing category IDs:',
          missingCategoryIds
        );

        if (missingAccountIds.length === 0 && missingCategoryIds.length === 0) {
          console.log('getMonthlyTransactions: All data cached, using cache');
          const accountMap = new Map(
            Array.from(accountIds).map((id) => [
              id,
              this.accountsCache.get(id)!,
            ])
          );
          const categoryMap = new Map(
            Array.from(categoryIds).map((id) => [
              id,
              this.categoriesCache.get(id)!,
            ])
          );
          return of(
            filteredRecords.map((record) =>
              this.convertToDisplayRecord(record, accountMap, categoryMap)
            )
          );
        }

        // Since we preloaded, this block should rarely execute unless preloading failed
        console.warn(
          'getMonthlyTransactions: Preload incomplete, fetching missing data'
        );
        return this.getAccountsByIds(missingAccountIds).pipe(
          switchMap((accounts) => {
            accounts.forEach((acc) => {
              if (acc.id) {
                this.accountsCache.set(acc.id, acc);
              }
            });
            return this.getCategoriesByIds(missingCategoryIds).pipe(
              map((categories) => {
                categories.forEach((cat) => {
                  if (cat.id) {
                    this.categoriesCache.set(cat.id, cat);
                  }
                });
                console.log(
                  'getMonthlyTransactions: Updated cache with accounts:',
                  accounts.map((a) => a.id)
                );
                console.log(
                  'getMonthlyTransactions: Updated cache with categories:',
                  categories.map((c) => c.id)
                );

                const accountMap = new Map(
                  Array.from(accountIds).map((id) => [
                    id,
                    this.accountsCache.get(id)!,
                  ])
                );
                const categoryMap = new Map(
                  Array.from(categoryIds).map((id) => [
                    id,
                    this.categoriesCache.get(id)!,
                  ])
                );

                return filteredRecords.map((record) =>
                  this.convertToDisplayRecord(record, accountMap, categoryMap)
                );
              })
            );
          })
        );
      }),
      catchError((error) => {
        console.error('getMonthlyTransactions: Error fetching records:', error);
        return of([]);
      })
    );
  }

  /**
   * Get transactions for a specific date
   */
  getTransactionsForDate(date: Date): Observable<DisplayRecord[]> {
    const dateStr = date.toISOString().split('T')[0];
    console.log(`getTransactionsForDate: Fetching for ${dateStr}`);

    return this.http.get<Record[]>(this.apiUrl).pipe(
      map((records) =>
        records.filter((record) => {
          const recordDate = record.date.split('T')[0];
          return recordDate === dateStr;
        })
      ),
      switchMap((filteredRecords) => {
        console.log(
          `getTransactionsForDate: Found ${filteredRecords.length} records`
        );
        if (filteredRecords.length === 0) {
          console.log(
            'getTransactionsForDate: No records, skipping account/category fetch'
          );
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

        const missingAccountIds = this.accountsFetched
          ? []
          : Array.from(accountIds).filter((id) => !this.accountsCache.has(id));
        const missingCategoryIds = this.categoriesFetched
          ? []
          : Array.from(categoryIds).filter(
              (id) => !this.categoriesCache.has(id)
            );

        console.log(
          'getTransactionsForDate: Missing account IDs:',
          missingAccountIds
        );
        console.log(
          'getTransactionsForDate: Missing category IDs:',
          missingCategoryIds
        );

        if (missingAccountIds.length === 0 && missingCategoryIds.length === 0) {
          console.log('getTransactionsForDate: All data cached, using cache');
          const accountMap = new Map(
            Array.from(accountIds).map((id) => [
              id,
              this.accountsCache.get(id)!,
            ])
          );
          const categoryMap = new Map(
            Array.from(categoryIds).map((id) => [
              id,
              this.categoriesCache.get(id)!,
            ])
          );
          return of(
            filteredRecords
              .map((record) =>
                this.convertToDisplayRecord(record, accountMap, categoryMap)
              )
              .sort(
                (a, b) =>
                  new Date(b.sortDate).getTime() -
                  new Date(a.sortDate).getTime()
              )
          );
        }

        console.warn(
          'getTransactionsForDate: Preload incomplete, fetching missing data'
        );
        return this.getAccountsByIds(missingAccountIds).pipe(
          switchMap((accounts) => {
            accounts.forEach((acc) => {
              if (acc.id) {
                this.accountsCache.set(acc.id, acc);
              }
            });
            return this.getCategoriesByIds(missingCategoryIds).pipe(
              map((categories) => {
                categories.forEach((cat) => {
                  if (cat.id) {
                    this.categoriesCache.set(cat.id, cat);
                  }
                });
                console.log(
                  'getTransactionsForDate: Updated cache with accounts:',
                  accounts.map((a) => a.id)
                );
                console.log(
                  'getTransactionsForDate: Updated cache with categories:',
                  categories.map((c) => c.id)
                );

                const accountMap = new Map(
                  Array.from(accountIds).map((id) => [
                    id,
                    this.accountsCache.get(id)!,
                  ])
                );
                const categoryMap = new Map(
                  Array.from(categoryIds).map((id) => [
                    id,
                    this.categoriesCache.get(id)!,
                  ])
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
          })
        );
      }),
      catchError((error) => {
        console.error('getTransactionsForDate: Error fetching records:', error);
        return of([]);
      })
    );
  }

  /**
   * Get accounts by IDs, using cache if available
   */
  private getAccountsByIds(ids: string[]): Observable<Accounts[]> {
    console.log('getAccountsByIds: Called with IDs:', ids);
    if (ids.length === 0) {
      console.log('getAccountsByIds: Empty ID list, returning empty array');
      return of([]);
    }

    if (this.accountsFetched) {
      const cachedAccounts = ids
        .map((id) => this.accountsCache.get(id))
        .filter((acc): acc is Accounts => acc !== undefined);
      console.log(
        'getAccountsByIds: All accounts pre-fetched, returning cached:',
        cachedAccounts.map((a) => a.id)
      );
      return of(cachedAccounts);
    }

    const cachedAccounts: Accounts[] = [];
    const missingIds: string[] = [];

    ids.forEach((id) => {
      const cachedAccount = this.accountsCache.get(id);
      if (cachedAccount) {
        cachedAccounts.push(cachedAccount);
      } else {
        missingIds.push(id);
      }
    });

    console.log(
      'getAccountsByIds: Cached accounts:',
      cachedAccounts.map((a) => a.id)
    );
    console.log('getAccountsByIds: Missing IDs:', missingIds);

    if (missingIds.length === 0) {
      console.log('getAccountsByIds: All accounts cached, returning cache');
      return of(cachedAccounts);
    }

    // Fetch all accounts since JSON Server doesn't support bulk ID fetching
    return this.http.get<Accounts[]>(this.accountsUrl).pipe(
      map((accounts) => {
        accounts.forEach((acc) => {
          if (acc.id) {
            this.accountsCache.set(acc.id, acc);
          }
        });
        this.accountsFetched = true;
        console.log(
          'getAccountsByIds: Cached all accounts:',
          Array.from(this.accountsCache.keys())
        );
        return ids
          .map((id) => this.accountsCache.get(id))
          .filter((acc): acc is Accounts => acc !== undefined);
      }),
      catchError((error) => {
        console.error('getAccountsByIds: Error fetching accounts:', error);
        console.log('getAccountsByIds: Returning cached accounts');
        return of(cachedAccounts);
      })
    );
  }

  /**
   * Get categories by IDs, using cache if available
   */
  private getCategoriesByIds(ids: string[]): Observable<Category[]> {
    console.log('getCategoriesByIds: Called with IDs:', ids);
    if (ids.length === 0) {
      console.log('getCategoriesByIds: Empty ID list, returning empty array');
      return of([]);
    }

    if (this.categoriesFetched) {
      const cachedCategories = ids
        .map((id) => this.categoriesCache.get(id))
        .filter((cat): cat is Category => cat !== undefined);
      console.log(
        'getCategoriesByIds: All categories pre-fetched, returning cached:',
        cachedCategories.map((c) => c.id)
      );
      return of(cachedCategories);
    }

    const cachedCategories: Category[] = [];
    const missingIds: string[] = [];

    ids.forEach((id) => {
      const cachedCategory = this.categoriesCache.get(id);
      if (cachedCategory) {
        cachedCategories.push(cachedCategory);
      } else {
        missingIds.push(id);
      }
    });

    console.log(
      'getCategoriesByIds: Cached categories:',
      cachedCategories.map((c) => c.id)
    );
    console.log('getCategoriesByIds: Missing IDs:', missingIds);

    if (missingIds.length === 0) {
      console.log('getCategoriesByIds: All categories cached, returning cache');
      return of(cachedCategories);
    }

    return this.http.get<Category[]>(this.categoriesUrl).pipe(
      map((categories) => {
        this.categoriesFetched = true;
        categories.forEach((cat) => {
          if (cat.id) {
            this.categoriesCache.set(cat.id, cat);
          }
        });
        console.log(
          'getCategoriesByIds: Cached all categories:',
          Array.from(this.categoriesCache.keys())
        );
        return ids
          .map((id) => this.categoriesCache.get(id))
          .filter((cat): cat is Category => cat !== undefined);
      }),
      catchError((error) => {
        console.error('getCategoriesByIds: Error fetching categories:', error);
        console.log('getCategoriesByIds: Returning cached categories');
        return of(cachedCategories);
      })
    );
  }

  /**
   * Generate calendar days for a given month
   */
  generateCalendarDays(year: number, month: number): CalendarDay[] {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
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
    days.forEach((day) => {
      day.transactions = [];
      day.totalIncome = 0;
      day.totalExpense = 0;
      day.transactionCount = 0;
    });

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

    days.forEach((day) => {
      day.transactions.sort(
        (a, b) =>
          new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime()
      );
    });

    return days;
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
