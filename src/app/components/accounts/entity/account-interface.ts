import { FormControl } from '@angular/forms';

export interface Accounts {
  id?: string;
  name: string;
  description: string;
  initialAmount: number;
  balance: number; //its is matching
  createdDate: string;
  updatedDate: string;
  isDeleted?: boolean;
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
