import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

interface Category {
  id?: number;
  name: string;
  description: string;
  createdDate?: string;
  updatedDate?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private apiUrl = 'http://localhost:3000/categories';
  private categoryChanged$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  getCategories(
    page: number,
    size: number,
    sortField: keyof Category,
    sortDirection: 'asc' | 'desc'
  ): Observable<{ categories: Category[]; totalItems: number }> {
    const params = new HttpParams()
      .set('_page', page.toString())
      .set('_limit', size.toString())
      .set('_sort', sortField)
      .set('_order', sortDirection);

    return this.http
      .get<Category[]>(this.apiUrl, {
        params,
        observe: 'response',
      })
      .pipe(
        map((res: HttpResponse<Category[]>) => {
          const totalItems = Number(res.headers.get('X-Total-Count') || '0');
          return { categories: res.body ?? [], totalItems };
        })
      );
  }

  getCategory(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/${id}`);
  }

  addCategory(category: Category): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, category);
  }

  updateCategory(id: string, category: Category): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/${id}`, category);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  notifyCategoryChanged(): void {
    this.categoryChanged$.next();
  }

  onCategoryChanged(): Observable<void> {
    return this.categoryChanged$.asObservable();
  }
}
