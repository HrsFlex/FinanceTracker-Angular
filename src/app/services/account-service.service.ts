import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/enviroments/environment';
import { Accounts } from '../components/accounts/entity/account-interface';

@Injectable({
  providedIn: 'root',
})
export class AccountServiceService {
  private apiUrl = environment.baseUrl + '/accounts';
  private accountChanged = new Subject<void>();

  constructor(private http: HttpClient) {}

  /**
   * Get paginated, sorted list of accounts
   */
  getAccounts(
    page: number,
    pageSize: number,
    sortField: string // now accepting `-field` format
  ): Observable<{ accounts: Accounts[]; totalItems: number }> {
    const params = new HttpParams()
      .set('_page', page.toString())
      .set('_limit', pageSize.toString())
      .set('_sort', sortField) // can be like `-updatedDate`
      .set('isDeleted', 'false'); // Exclude deleted accounts

    return this.http
      .get<Accounts[]>(this.apiUrl, {
        params,
        observe: 'response',
      })
      .pipe(
        map((response) => ({
          accounts: response.body || [],
          totalItems: Number(response.headers.get('X-Total-Count')) || 0,
        }))
      );
  }

  /**
   * Delete account by ID
   */
  getAllAccounts(): Observable<Accounts[]> {
    return this.http.get<Accounts[]>(this.apiUrl); // Fetch all accounts, including deleted
  }

  deleteAccount(id: string): Observable<void> {
    return this.http
      .patch<void>(`${this.apiUrl}/${id}`, { isDeleted: true })
      .pipe(
        catchError((err) =>
          throwError(
            () => new Error('Failed to soft delete account: ' + err.message)
          )
        )
      );
  }

  /**
   * Emit change event after add/update/delete
   */
  notifyAccountsChanged(): void {
    this.accountChanged.next();
  }

  /**
   * Subscribe to account change events
   */
  onAccountsChanged(): Observable<void> {
    return this.accountChanged.asObservable();
  }
}
