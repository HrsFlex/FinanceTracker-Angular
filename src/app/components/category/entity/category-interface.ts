import { FormControl } from '@angular/forms';

export interface Category {
  id?: string;
  name: string;
  description: string;
  createdDate?: string;
  updatedDate?: string;
}

export interface CategoryForm {
  id?: FormControl<string>;
  name: FormControl<string | null>;
  description: FormControl<string | null>;
  createdDate?: FormControl<string>;
  updatedDate?: FormControl<string>;
}
