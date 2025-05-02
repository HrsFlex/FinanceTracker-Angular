import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-accounts-upsert',
  templateUrl: './accounts-upsert.component.html',
  styleUrls: ['./accounts-upsert.component.css'],
})
export class AccountsUpsertComponent implements OnInit {
  accountsForm: FormGroup;
  isEditing = false;
  accountsId: string | null = null;
  private apiUrl = 'http://localhost:3000/accounts';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.accountsForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
    });
  }

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.accountsId = idParam;

    if (this.accountsId) {
      this.isEditing = true;
      this.loadAccounts();
    }
  }

  loadAccounts() {
    if (!this.accountsId) return;

    this.http.get<any>(`${this.apiUrl}/${this.accountsId}`).subscribe(
      (accounts) => {
        this.accountsForm.patchValue({
          name: accounts.name,
          description: accounts.description,
        });
      }
      // (error) => console.error('Error loading account:', error)
    );
  }
  addAccounts() {
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
      (error) =>
        alert(
          `Error ${this.isEditing ? 'updating' : 'adding'} accounts: ${
            error.message
          }`
        )
    );
  }

  cancelEdit() {
    this.router.navigate(['/accounts-items']);
  }
}
