import { Component, OnInit } from '@angular/core';
import { debounceTime } from 'rxjs/operators';
import { CategoryService } from '../../../services/category-service.service';
import { Category } from '../entity/category-interface';
import { DialogService } from 'src/app/services/dialog.service';

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
  public typeFilter: 'All' | 'income' | 'expense' = 'All';

  constructor(
    private categoryService: CategoryService,
    private dialogService: DialogService
  ) {}

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
        this.typeFilter
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

  removeCategory(id: any): void {
    this.dialogService
      .confirm(
        'Delete Category?',
        'Are you sure you want to delete this category? It will be removed from the list but remain in transactions.'
      )
      .then((confirmed) => {
        if (!confirmed) return;

        this.categoryService.deleteCategory(id).subscribe({
          next: () => {
            this.categories = this.categories.filter(
              (category) => category.id !== id
            );
            this.dialogService.toast('Category deleted successfully.');
          },
          error: (err) => {
            alert('Error deleting category: ' + err.message);
          },
        });
      });
  }

  public filterByType(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value as 'All' | 'income' | 'expense';
    this.typeFilter = value;
    this.resetAndReload();
  }
}
