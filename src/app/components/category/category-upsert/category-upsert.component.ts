import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-category-upsert',
  templateUrl: './category-upsert.component.html',
  styleUrls: ['./category-upsert.component.css'],
})
export class CategoryUpsertComponent implements OnInit {
  categoryForm: FormGroup;
  isEditing = false;
  categoryId: string | null = null;
  private apiUrl = 'http://localhost:3000/categories';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.categoryForm = new FormGroup({
      name: new FormControl('', Validators.required),
      description: new FormControl('', Validators.required),
    });
  }

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.categoryId = idParam;

    if (this.categoryId) {
      this.isEditing = true;
      this.loadCategory();
    }
  }

  loadCategory() {
    if (!this.categoryId) return;

    this.http.get<any>(`${this.apiUrl}/${this.categoryId}`).subscribe(
      (category) => {
        this.categoryForm.patchValue(category);
      },
      (error) => console.error('Error loading category:', error)
    );
  }

  addCategory() {
    if (this.categoryForm.invalid) return;

    const today = new Date().toISOString().split('T')[0];
    const categoryData = {
      ...this.categoryForm.value,
      createdDate: this.isEditing ? undefined : today,
      updatedDate: today,
    };

    const request =
      this.isEditing && this.categoryId
        ? this.http.put(`${this.apiUrl}/${this.categoryId}`, categoryData)
        : this.http.post(this.apiUrl, categoryData);

    request.subscribe(
      () => this.router.navigate(['/category-list']),
      (error) =>
        alert(
          `Error ${this.isEditing ? 'updating' : 'adding'} category: ${
            error.message
          }`
        )
    );
  }

  cancelEdit() {
    this.router.navigate(['/category-list']);
  }
}
