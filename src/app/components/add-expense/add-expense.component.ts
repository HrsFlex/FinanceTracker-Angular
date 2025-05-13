import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CategoryService } from '../../services/category-service.service';
import { ExpenseService } from '../../services/expense.service';
import { AccountServiceService } from '../../services/account-service.service';

interface Category {
  id: string;
  name: string;
  description: string;
  createdDate?: string;
  updatedDate?: string;
}

interface Account {
  id: string;
  name: string;
  balance?: number;
}

interface Expense {
  id?: string;
  amount: number;
  date: string;
  notes?: string;
  categoryId: string;
  accountId: string;
}

@Component({
  selector: 'app-add-expense',
  templateUrl: './add-expense.component.html',
  styleUrls: ['./add-expense.component.css'],
})
export class AddExpenseComponent implements OnInit {
  expenseForm: FormGroup;
  categories: Category[] = [];
  accounts: Account[] = [];

  constructor(
    private expenseService: ExpenseService,
    private categoryService: CategoryService,
    private accountService: AccountServiceService,
    private router: Router
  ) {
    this.expenseForm = new FormGroup({
      amount: new FormControl('', [Validators.required, Validators.min(0.01)]),
      description: new FormControl(''),
      categoryId: new FormControl('', Validators.required),
      accountId: new FormControl('', Validators.required),
    });
  }

  ngOnInit() {
    this.loadCategories();
    this.loadAccounts();
  }

  loadCategories() {
    // this.categoryService.getCategories().subscribe(
    //   (categories) => {
    //     this.categories = categories;
    //   },
    //   (error) => console.error('Error loading categories:', error)
    // );
  }

  loadAccounts() {
    // this.accountService.getAccounts().subscribe(
    //   (accounts) => {
    //     this.accounts = accounts;
    //   },
    //   (error) => console.error('Error loading accounts:', error)
    // );
  }

  addExpense() {
    if (this.expenseForm.invalid) return;

    const today = new Date().toISOString().split('T')[0];
    const expenseData: Expense = {
      ...this.expenseForm.value,
      date: today,
      notes: this.expenseForm.value.description,
    };

    // this.expenseService.createExpense(expenseData).subscribe(
    //   () => this.router.navigate(['/expense-list']),
    //   (error) => alert(`Error adding expense: ${error.message}`)
    // );
  }

  cancel() {
    this.router.navigate(['/']);
  }

  navigateToAccounts() {
    this.router.navigate(['/accounts-items']);
  }

  navigateToCategories() {
    this.router.navigate(['/category-list']);
  }
}
