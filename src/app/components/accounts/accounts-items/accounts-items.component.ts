import { Component, OnInit } from '@angular/core';
import {
  Accounts,
  AccountServiceService,
} from 'src/app/services/account-service.service';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-accounts-items',
  templateUrl: './accounts-items.component.html',
  styleUrls: ['./accounts-items.component.css'],
})
export class AccountsItemsComponent implements OnInit {
  public accounts: Accounts[] = [];
  public currentPage = 1;
  public pageSize = 10;
  public totalItems = 0;
  public totalPages = 1;
  public sortField: keyof Accounts = 'name';
  public sortDirection: 'asc' | 'desc' = 'asc';

  constructor(private accountsService: AccountServiceService) {}

  public ngOnInit(): void {
    this.loadAccounts();

    this.accountsService
      .onAccountsChanged()
      .pipe(debounceTime(100))
      .subscribe(() => {
        this.resetAndReload();
      });
  }

  private resetAndReload(): void {
    this.currentPage = 1;
    this.loadAccounts();
  }

  public loadAccounts(): void {
    this.accountsService
      .getAccounts(
        this.currentPage,
        this.pageSize,
        this.sortField,
        this.sortDirection
      )
      .subscribe({
        next: ({ accounts, totalItems }) => {
          this.accounts = accounts;
          this.totalItems = totalItems;
          this.totalPages = Math.max(Math.ceil(totalItems / this.pageSize), 1);
        },
        error: (error) => {
          console.error('Error loading Account:', error);
          alert('Error loading Account: ' + error.message);
        },
      });
  }

  public sort(field: keyof Accounts): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.resetAndReload();
  }

  public changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadAccounts();
  }

  public removeAccounts(id: any): void {
    this.accountsService.deleteAccounts(id).subscribe({
      next: () => {
        this.accountsService.notifyAccountsChanged();
        this.resetAndReload();
      },
      error: (error) => {
        // alert('Error deleting category: ' + error.message);
      },
    });
  }
}
