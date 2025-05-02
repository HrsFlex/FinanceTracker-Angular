import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/enviroments/environment';

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
  private apiUrl = environment.apiUrlCat;
  private categoryChanged = new Subject<void>();

  constructor(private http: HttpClient) {}

  public getCategories(
    page: number,
    size: number, //if need to implement pagination
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
