import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/enviroments/environment';
import { Record } from '../components/records/entity/record-interface';

@Injectable({
  providedIn: 'root',
})
export class RecordService {
  private apiUrl = environment.baseUrl + '/records';

  constructor(private http: HttpClient) {}

  createRecord(record: Record): Observable<Record> {
    return this.http.post<Record>(this.apiUrl, record);
  }
}
