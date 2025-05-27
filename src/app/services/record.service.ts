import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, throwError, of, Subject } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { environment } from 'src/enviroments/environment';
import {
  Accounts,
  Record,
} from '../components/records/entity/record-interface';

@Injectable({
  providedIn: 'root',
})
export class RecordService {
  private apiUrl = environment.baseUrl + '/records';
  private accountsUrl = environment.baseUrl + '/accounts';
  private recordUpdated = new Subject<void>();
  recordUpdated$ = this.recordUpdated.asObservable();

  constructor(private http: HttpClient) {}

  public getRecords(
    sortField: string = 'date',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Observable<Record[]> {
    let params = new HttpParams();
    if (sortField) {
      const sortValue =
        sortOrder === 'desc' ? `-${sortField},-id` : `${sortField},id`;
      params = params.set('_sort', sortValue);
    }
    return this.http.get<Record[]>(this.apiUrl, { params });
  }
  public getRecordsDashBoard(
    page: number,
    pageSize: number,
    sortField: string,

    typeFilter: 'all' | 'income' | 'expense' | 'transfer' = 'all'
  ): Observable<{ records: Record[]; totalItems: number }> {
    let params = new HttpParams()
      .set('_page', page.toString())
      .set('_limit', pageSize.toString())
      .set('_sort', sortField);

    if (typeFilter !== 'all') {
      params = params.set('type', typeFilter);
    }

    return this.http
      .get<Record[]>(this.apiUrl, {
        params,
        observe: 'response',
      })
      .pipe(
        map((response) => ({
          records: response.body || [],
          totalItems: Number(response.headers.get('X-Total-Count')) || 0,
        }))
      );
  }

  getRecordById(id: string): Observable<Record> {
    return this.http
      .get<Record>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError((err) =>
          throwError(() => new Error('Failed to fetch record: ' + err.message))
        )
      );
  }

  createRecord(record: Record): Observable<Record> {
    const recordWithDate = {
      ...record,
      date: record.date || new Date().toISOString(),
    };
    return this.validateAndUpdateBalances(recordWithDate).pipe(
      switchMap(() => this.http.post<Record>(this.apiUrl, recordWithDate)),
      catchError((err) => throwError(() => new Error(err.message)))
    );
  }

  updateRecord(record: Record): Observable<Record> {
    if (!record.id) {
      return throwError(() => new Error('Record ID is required for update'));
    }
    return this.getRecordById(record.id).pipe(
      switchMap((originalRecord) =>
        forkJoin({
          fromAccount: this.http.get<Accounts>(
            `${this.accountsUrl}/${String(originalRecord.fromAccountId)}`
          ),
          toAccount:
            originalRecord.type === 'transfer' && originalRecord.toAccountId
              ? this.http.get<Accounts>(
                  `${this.accountsUrl}/${String(originalRecord.toAccountId)}`
                )
              : of(null),
        }).pipe(
          switchMap(({ fromAccount, toAccount }) => {
            const updates: Observable<any>[] = [];

            // Revert original transaction
            let fromBalanceUpdate: number;
            if (originalRecord.type === 'income') {
              fromBalanceUpdate = fromAccount.balance - originalRecord.amount;
            } else {
              // Expense or transfer: add amount back to fromAccount
              fromBalanceUpdate = fromAccount.balance + originalRecord.amount;
            }

            updates.push(
              this.http.patch(
                `${this.accountsUrl}/${String(originalRecord.fromAccountId)}`,
                {
                  balance: fromBalanceUpdate,
                }
              )
            );

            if (
              originalRecord.type === 'transfer' &&
              toAccount &&
              originalRecord.toAccountId
            ) {
              const toBalanceUpdate = toAccount.balance - originalRecord.amount;
              updates.push(
                this.http.patch(
                  `${this.accountsUrl}/${String(originalRecord.toAccountId)}`,
                  {
                    balance: toBalanceUpdate,
                  }
                )
              );
            }

            return forkJoin(updates);
          })
        )
      ),
      // After reverting, apply new transaction
      switchMap(() => this.validateAndUpdateBalances(record)),
      switchMap(() => {
        console.log('PATCH request to update record:', record); // Debug
        return this.http.patch<Record>(`${this.apiUrl}/${record.id}`, record);
      }),
      switchMap((updatedRecord) => {
        this.recordUpdated.next(); // Notify record change
        return of(updatedRecord);
      }),
      catchError((err) =>
        throwError(() => new Error('Failed to update record: ' + err.message))
      )
    );
  }

  deleteRecord(id: string): Observable<void> {
    return this.getRecordById(id).pipe(
      switchMap((record) => {
        const { type, fromAccountId, toAccountId, amount } = record;
        return forkJoin({
          fromAccount: this.http.get<Accounts>(
            `${this.accountsUrl}/${String(fromAccountId)}`
          ),
          toAccount:
            type === 'transfer' && toAccountId
              ? this.http.get<Accounts>(
                  `${this.accountsUrl}/${String(toAccountId)}`
                )
              : of(null),
        }).pipe(
          switchMap(({ fromAccount, toAccount }) => {
            const updates: Observable<any>[] = [];

            let fromBalanceUpdate: number;
            if (type === 'income') {
              fromBalanceUpdate = fromAccount.balance - amount;
            } else {
              fromBalanceUpdate = fromAccount.balance + amount;
            }

            updates.push(
              this.http.patch(`${this.accountsUrl}/${String(fromAccountId)}`, {
                balance: fromBalanceUpdate,
              })
            );

            if (type === 'transfer' && toAccount && toAccountId) {
              const toBalanceUpdate = toAccount.balance - amount;
              updates.push(
                this.http.patch(`${this.accountsUrl}/${String(toAccountId)}`, {
                  balance: toBalanceUpdate,
                })
              );
            }

            return forkJoin(updates);
          }),
          switchMap(() => this.http.delete<void>(`${this.apiUrl}/${id}`)),
          catchError((err) =>
            throwError(
              () => new Error('Failed to delete record: ' + err.message)
            )
          )
        );
      }),
      catchError((err) => throwError(() => new Error(err.message)))
    );
  }

  private validateAndUpdateBalances(record: Record): Observable<any> {
    const { type, fromAccountId, toAccountId, amount } = record;

    return this.http
      .get<Accounts>(`${this.accountsUrl}/${String(fromAccountId)}`)
      .pipe(
        switchMap((fromAccount) => {
          if (type === 'expense' || type === 'transfer') {
            if (fromAccount.balance < amount) {
              return throwError(
                () => new Error('Insufficient balance in from account')
              );
            }
          }

          const updates: Observable<any>[] = [];

          let fromBalanceUpdate: number;
          if (type === 'income') {
            fromBalanceUpdate = fromAccount.balance + amount;
          } else {
            fromBalanceUpdate = fromAccount.balance - amount;
          }
          updates.push(
            this.http.patch(`${this.accountsUrl}/${String(fromAccountId)}`, {
              balance: fromBalanceUpdate,
            })
          );

          if (type === 'transfer' && toAccountId) {
            return this.http
              .get<Accounts>(`${this.accountsUrl}/${String(toAccountId)}`)
              .pipe(
                switchMap((toAccount) => {
                  const toBalanceUpdate = toAccount.balance + amount;
                  updates.push(
                    this.http.patch(
                      `${this.accountsUrl}/${String(toAccountId)}`,
                      { balance: toBalanceUpdate }
                    )
                  );
                  return forkJoin(updates);
                })
              );
          }

          return forkJoin(updates);
        }),
        catchError((err) => throwError(() => new Error(err.message)))
      );
  }
}
