import { FormControl } from '@angular/forms';

export interface Accounts {
  id?: string;
  name: string;
  description: string;
  initialAmount: number;
  balance: number;
  createdDate: string;
  updatedDate: string;
}

export interface AccountsForm {
  id?: FormControl<string>;
  name: FormControl<string | null>;
  description: FormControl<string | null>;
  initialAmount: FormControl<number | null>;
  balance: FormControl<number | null>;
  createdDate?: FormControl<string>;
  updatedDate?: FormControl<string>;
}
