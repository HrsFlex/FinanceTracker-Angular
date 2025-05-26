import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'src/enviroments/environment';
import { Accounts, AccountsForm } from '../entity/account-interface';
import { DialogService } from 'src/app/services/dialog.service';

@Component({
  selector: 'app-accounts-upsert',
  templateUrl: './accounts-upsert.component.html',
  styleUrls: ['./accounts-upsert.component.css'],
})
export class AccountsUpsertComponent implements OnInit {
  accountsForm: FormGroup<AccountsForm>;
  isEditing = false;
  accountsId: string | null = null;
  private apiUrl = environment.baseUrl + '/accounts';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private dialogService: DialogService
  ) {
    this.accountsForm = new FormGroup<AccountsForm>({
      name: new FormControl<string>('', Validators.required),
      description: new FormControl<string>('', Validators.required),
      initialAmount: new FormControl<number>(0, [
        Validators.required,
        Validators.min(0),
      ]),
      balance: new FormControl<number>(0, [
        Validators.required,
        Validators.min(0),
      ]),
    });
  }

  public ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.accountsId = idParam;

    if (this.accountsId) {
      this.isEditing = true;
      this.loadAccounts();
    }
  }

  public loadAccounts() {
    // if (!this.accountsId) return;

    this.http.get<Accounts>(`${this.apiUrl}/${this.accountsId}`).subscribe(
      (accounts) => {
        this.accountsForm.patchValue(accounts);
      },
      (error) => console.error('Error loading account:', error)
    );
  }
  public addAccounts() {
    if (this.accountsForm.invalid) return;

    const today = new Date().toISOString().split('T')[0];
    const accountsData = {
      ...this.accountsForm.value,
      createdDate: this.isEditing ? undefined : today,
      updatedDate: today,
    };

    const request =
      this.isEditing && this.accountsId
        ? this.http.put(`${this.apiUrl}/${this.accountsId}`, accountsData)
        : this.http.post(this.apiUrl, accountsData);

    request.subscribe(
      () => this.router.navigate(['/accounts-items']),
      (error) => {
        const action = this.isEditing ? 'updating' : 'adding';
        this.dialogService.alert(
          'Error',
          `Error ${action} accounts: ${error.message}`
        );
      }
    );
  }

  clearZero(controlName: 'initialAmount' | 'balance') {
    const control = this.accountsForm.get(controlName);
    if (control?.value === 0) {
      control.setValue(null);
    }
  }

  cancelEdit() {
    this.router.navigate(['/accounts-items']);
  }
}
