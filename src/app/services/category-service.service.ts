import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/enviroments/environment';
import { Category } from '../components/category/entity/category-interface';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private apiUrl = environment.baseUrl + '/categories';
  private categoryChanged = new Subject<void>();

  constructor(private http: HttpClient) {}

  public getCategories(
    page: number,
    pageSize: number, //if need to implement pagination
    sortField: string,
    typeFilter: 'All' | 'income' | 'expense' = 'All'
  ): Observable<{ categories: Category[]; totalItems: number }> {
    let params = new HttpParams()
      .set('_page', page.toString())
      .set('_limit', pageSize.toString())
      .set('_sort', sortField);

    if (typeFilter !== 'All') {
      params = params.set('type', typeFilter);
    }

    return this.http
      .get<Category[]>(this.apiUrl, {
        params,
        observe: 'response',
      })
      .pipe(
        map((response) => ({
          categories: response.body || [],
          totalItems: Number(response.headers.get('X-Total-Count')) || 0,
        }))
      );
  }

  public deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  public notifyCategoryChanged(): void {
    this.categoryChanged.next();
  }

  public onCategoryChanged(): Observable<void> {
    return this.categoryChanged.asObservable();
  }
}
