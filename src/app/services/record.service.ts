import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, throwError, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
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

  constructor(private http: HttpClient) {}

  getRecords(
    sortField: string = 'date',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Observable<Record[]> {
    let params = new HttpParams();
    if (sortField) {
      const sortValue = sortOrder === 'desc' ? `-${sortField}` : sortField;
      params = params.set('_sort', sortValue);
    }
    return this.http.get<Record[]>(this.apiUrl, { params });
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
    return this.validateAndUpdateBalances(record).pipe(
      switchMap(() =>
        this.http.patch<Record>(`${this.apiUrl}/${record.id}`, record)
      ),
      catchError((err) => throwError(() => new Error(err.message)))
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

            // Revert balances based on transaction type
            let fromBalanceUpdate: number;
            if (type === 'income') {
              // Reverse income: subtract amount from fromAccount
              fromBalanceUpdate = fromAccount.balance - amount;
            } else {
              // Reverse expense or transfer: add amount back to fromAccount
              fromBalanceUpdate = fromAccount.balance + amount;
            }

            // if (fromBalanceUpdate < 0) {
            //   return throwError(
            //     () =>
            //       new Error(
            //         'Reverting transaction would result in negative balance for from account'
            //       )
            //   );
            // }

            updates.push(
              this.http.patch(`${this.accountsUrl}/${String(fromAccountId)}`, {
                balance: fromBalanceUpdate,
              })
            );

            if (type === 'transfer' && toAccount && toAccountId) {
              // Reverse transfer: subtract amount from toAccount
              const toBalanceUpdate = toAccount.balance - amount;
              // if (toBalanceUpdate < 0) {
              //   return throwError(
              //     () =>
              //       new Error(
              //         'Reverting transaction would result in negative balance for to account'
              //       )
              //   );
              // }
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
