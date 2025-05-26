import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'src/enviroments/environment';
import { Category, CategoryForm } from '../entity/category-interface';
import { DialogService } from 'src/app/services/dialog.service';
// import { DialogService } from 'src/app/services/dialog.service';

@Component({
  selector: 'app-category-upsert',
  templateUrl: './category-upsert.component.html',
  styleUrls: ['./category-upsert.component.css'],
})
export class CategoryUpsertComponent implements OnInit {
  categoryForm: FormGroup<CategoryForm> = new FormGroup<CategoryForm>({
    name: new FormControl<string>('', Validators.required),
    description: new FormControl<string>('', Validators.required),
  });

  isEditing = false;
  categoryId: string | null = null;
  private apiUrl = environment.baseUrl + '/categories';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private dialogService: DialogService
  ) {}

  public ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.categoryId = idParam;

    if (this.categoryId) {
      this.isEditing = true;
      this.loadCategory();
    }
  }

  public loadCategory() {
    // if (!this.categoryId) return;

    this.http.get<Category>(`${this.apiUrl}/${this.categoryId}`).subscribe(
      (category) => {
        this.categoryForm.patchValue(category);
      },
      (error) => console.error('Error loading category:', error)
    );
  }

  public addCategory() {
    if (this.categoryForm.invalid) return;

    const today = new Date().toISOString().split('T')[0];
    const categoryData = {
      ...this.categoryForm.value,
      createdDate: this.isEditing ? undefined : today,
      updatedDate: today,
    };

    const request =
      this.isEditing && this.categoryId //doing editing
        ? this.http.put(`${this.apiUrl}/${this.categoryId}`, categoryData)
        : this.http.post(this.apiUrl, categoryData);

    request.subscribe(
      () => this.router.navigate(['/category-list']),
      (error) =>
        this.dialogService.alert(
          'Error',
          `Error ${this.isEditing ? 'updating' : 'adding'} category: ${
            error.message
          }`
        )
    );
  }

  public cancelEdit() {
    this.router.navigate(['/category-list']);
  }
}
