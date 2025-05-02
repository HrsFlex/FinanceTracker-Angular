import { Component, OnInit } from '@angular/core';
import { debounceTime } from 'rxjs/operators';
import { CategoryService } from '../../../services/category-service.service';

interface Category {
  id?: number;
  name: string;
  description: string;
  createdDate?: string;
  updatedDate?: string;
}

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.css'],
})
export class CategoryListComponent implements OnInit {
  categories: Category[] = [];
  currentPage = 1;
  pageSize = 7;
  totalItems = 0;
  totalPages = 1;
  sortField: keyof Category = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.loadCategories();

    this.categoryService
      .onCategoryChanged()
      .pipe(debounceTime(100))
      .subscribe(() => {
        this.resetAndReload();
      });
  }

  private resetAndReload(): void {
    this.currentPage = 1;
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService
      .getCategories(
        this.currentPage,
        this.pageSize,
        this.sortField,
        this.sortDirection
      )
      .subscribe({
        next: ({ categories, totalItems }) => {
          this.categories = categories;
          this.totalItems = totalItems;
          this.totalPages = Math.max(Math.ceil(totalItems / this.pageSize), 1);
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          alert('Error loading categories: ' + error.message);
        },
      });
  }
  onPageChange(event: any): void {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex + 1; // MatPaginator is zero-based
    this.loadCategories();
  }

  sort(field: keyof Category): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.resetAndReload();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadCategories();
  }

  public removeCategory(id: any): void {
    this.categoryService.deleteCategory(id).subscribe({
      next: () => {
        this.categoryService.notifyCategoryChanged();
        this.resetAndReload();
      },
      error: (error) => {
        // alert('Error deleting category: ' + error.message);
      },
    });
  }
}
