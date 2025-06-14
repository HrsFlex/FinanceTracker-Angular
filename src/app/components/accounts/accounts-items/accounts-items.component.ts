import { Component, OnInit } from '@angular/core';
import { AccountServiceService } from 'src/app/services/account-service.service';
import { debounceTime } from 'rxjs/operators';
import { Accounts } from '../entity/account-interface';
import { DialogService } from 'src/app/services/dialog.service';

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

  // Remove 'keyof Accounts' because we'll send "-field" string
  public sortField: string = '-updatedDate'; // default: latest updated first

  constructor(
    private accountsService: AccountServiceService,
    private dialogService: DialogService
  ) {}

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
      .getAccounts(this.currentPage, this.pageSize, this.sortField)
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
    // Toggle logic using '-' prefix
    if (this.sortField === field) {
      this.sortField = '-' + field;
    } else if (this.sortField === '-' + field) {
      this.sortField = field;
    } else {
      this.sortField = field;
    }

    this.resetAndReload();
  }

  public changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadAccounts();
  }

  deleteAccount(id: any): void {
    this.dialogService
      .confirm(
        'Delete Account?',
        'Are you sure you want to delete this account? It will be removed from the list but remain in transactions.'
      )
      .then((confirmed) => {
        if (!confirmed) return;

        this.accountsService.deleteAccount(id).subscribe({
          next: () => {
            this.accounts = this.accounts.filter(
              (account) => account.id !== id
            );
            this.dialogService.toast('Account deleted successfully.');
          },
          error: (err) => {
            alert('Error deleting account: ' + err.message);
          },
        });
      });
  }
}
