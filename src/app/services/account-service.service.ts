import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Accounts {
  id: number;
  name: string;
  description: string;
  createdDate: string;
  updatedDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccountServiceService {
  private apiUrl = 'http://localhost:3000/accounts';
  private accountChanged = new Subject<void>();

  constructor(private http: HttpClient) { }

  getAccounts(
      page: number,
      pageSize: number,
      sortField: keyof Accounts | '',
      sortDirection: 'asc' | 'desc' = 'asc'
    ): Observable<{ accounts: Accounts[]; totalItems: number }> {
      const sortQuery = sortField ? `_sort=${sortField}&_order=${sortDirection}` : '';
      const url = `${this.apiUrl}?_page=${page}&_limit=${pageSize}&${sortQuery}`;

      return this.http.get<Accounts[]>(url, { observe: 'response' }).pipe(
        map((response) => ({
          accounts: response.body || [],
          totalItems: Number(response.headers.get('X-Total-Count')) || 0,
        }))
      );
    }

    deleteAccounts(id: number): Observable<void> {
      return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    // Notify when a Account is added or updated
    notifyAccountsChanged() {
      this.accountChanged.next();
    }

    // Subscribe to Account changes
    onAccountsChanged(): Observable<void> {
      return this.accountChanged.asObservable();
    }
}

