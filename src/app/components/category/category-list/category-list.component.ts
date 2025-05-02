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
  public categories: Category[] = [];
  public currentPage = 1;
  public pageSize = 10;
  public totalItems = 0;
  public totalPages = 1;
  public sortField: keyof Category = 'name';
  public sortDirection: 'asc' | 'desc' = 'asc';

  constructor(private categoryService: CategoryService) {}

  public ngOnInit(): void {
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

  public loadCategories(): void {
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
  public onPageChange(event: any): void {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex + 1; // MatPaginator is zero-based
    this.loadCategories();
  }

  public sort(field: keyof Category): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.resetAndReload();
  }

  public changePage(page: number): void {
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
