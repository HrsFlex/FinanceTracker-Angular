export interface Accounts {
  id?: string;
  name: string;
}

export interface Category {
  id?: string;
  name: string;
}

export interface Record {
  id?: number; // Optional for create
  type: 'income' | 'expense' | 'transfer';
  fromAccountId: number;
  toAccountId?: number; // Required for transfer
  categoryId: number; // Not required for transfer
  description: string;
  amount: number;
  date: string; // ISO date string (e.g., '2025-05-13')
}
