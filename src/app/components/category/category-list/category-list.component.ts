import { Component, OnInit } from '@angular/core';
import { debounceTime } from 'rxjs/operators';
import { CategoryService } from '../../../services/category-service.service';
import { Category } from '../entity/category-interface';

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

  // Remove 'keyof categories' because we'll send "-field" string
  public sortField: string = '-updatedDate'; // default: latest updated first

  constructor(
    private categoryService: CategoryService
  ) // private dialogService DialogService
  {}

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
      .getCategories(this.currentPage, this.pageSize, this.sortField)
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

  public sort(field: keyof Category): void {
    // Toggle logic using '-' prefix
    if (this.sortField === field) {
      this.sortField = '-' + field;
    } else if (this.sortField === '-' + field) {
      this.sortField = field;
    } else {
      this.sortField = field;
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
        console.error('Error deleting Category:', error);
      },
    });
  }
}
