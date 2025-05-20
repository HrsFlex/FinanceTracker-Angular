import { FormControl } from '@angular/forms';

export interface Accounts {
  id?: string;
  name: string;
  balance: number;
  isDeleted?: boolean;
}

export interface Category {
  id?: string;
  name: string;
}

export interface Record {
  id?: string; // Optional for create
  type: 'income' | 'expense' | 'transfer';
  fromAccountId: string;
  toAccountId?: string; // Required for transfer
  categoryId: string; // Not required for transfer
  description: string;
  amount: number;
  date: string; // ISO date string (e.g., '2025-05-13')
}

export interface RecordForm {
  type: FormControl<string>;
  fromAccountId: FormControl<string | null>;
  toAccountId: FormControl<string | null>;
  categoryId: FormControl<string | null>;
  description: FormControl<string>;
  amount: FormControl<number | null>;
  date: FormControl<string>;
}
export interface CategoryOption {
  value: string; // 'all', 'transfer', or category.id
  label: string; // 'All', 'Transfer', or category.name
}
