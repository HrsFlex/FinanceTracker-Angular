import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CategoryListComponent } from './components/category/category-list/category-list.component';
import { CategoryUpsertComponent } from './components/category/category-upsert/category-upsert.component';
import { AccountsItemsComponent } from './components/accounts/accounts-items/accounts-items.component';
import { AccountsUpsertComponent } from './components/accounts/accounts-upsert/accounts-upsert.component';
import { RecordsComponent } from './components/records/record-list/records.component';
import { RecordUpsertComponent } from './components/records/record-upsert/record-upsert.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ReportsComponent } from './components/reports/reports.component';
import { CalendarComponent } from './components/calendar/calendar.component';
import { SplashComponent } from './splash/splash.component';

const routes: Routes = [
  { path: '', component: SplashComponent },
  { path: 'category-list', component: CategoryListComponent },
  { path: 'category-upsert/:id', component: CategoryUpsertComponent },
  { path: 'category-upsert', component: CategoryUpsertComponent },
  { path: 'accounts-items', component: AccountsItemsComponent },
  { path: 'accounts-upsert', component: AccountsUpsertComponent },
  { path: 'accounts-upsert/:id', component: AccountsUpsertComponent },
  { path: 'records', component: RecordsComponent },
  { path: 'record-upsert', component: RecordUpsertComponent },
  { path: 'record-upsert/:id', component: RecordUpsertComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'reports', component: ReportsComponent },
  { path: 'calender', component: CalendarComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
