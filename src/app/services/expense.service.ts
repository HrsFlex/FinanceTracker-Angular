import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/enviroments/environment';

interface Account {
  id: string;
  name: string;
  balance?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ExpenseService {
  private apiUrl = `${
    environment.baseUrl + 'expenses'.replace('/categories', '')
  }/accounts`;

  constructor(private http: HttpClient) {}

  getAccounts(): Observable<Account[]> {
    return this.http.get<Account[]>(this.apiUrl);
  }
}
