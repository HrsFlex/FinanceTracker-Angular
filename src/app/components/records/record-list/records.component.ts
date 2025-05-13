import { Component, OnInit } from '@angular/core';
import { RecordService } from 'src/app/services/record.service';
import { Accounts } from '../../accounts/entity/account-interface';
import { Category } from '../../category/entity/category-interface';

@Component({
  selector: 'app-records',
  templateUrl: './records.component.html',
  styleUrls: ['./records.component.css'],
})
export class RecordsComponent implements OnInit {
  // accounts: Accounts[] = [];
  // categories: Category[] = [];

  constructor(private recordService: RecordService) {}

  ngOnInit(): void {
    // this.loadRecords();
  }

  // loadRecords(): void {
  //   this.recordService.getAllRecords().subscribe({
  //     next: (data) => {
  //       this.accounts = data.accounts;
  //       this.categories = data.categories;
  //     },
  //     error: (error) => {
  //       console.error('Error fetching records:', error);
  //     },
  //   });
}
