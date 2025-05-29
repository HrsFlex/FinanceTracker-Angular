import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CategoryListComponent } from './components/category/category-list/category-list.component';
import { CategoryUpsertComponent } from './components/category/category-upsert/category-upsert.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import { AccountsItemsComponent } from './components/accounts/accounts-items/accounts-items.component';
import { AccountsUpsertComponent } from './components/accounts/accounts-upsert/accounts-upsert.component';

// Angular Material Modules
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { AddExpenseComponent } from './components/add-expense/add-expense.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { RecordsComponent } from './components/records/record-list/records.component';
import { RecordUpsertComponent } from './components/records/record-upsert/record-upsert.component';
import { AccountServiceService } from './services/account-service.service';
import { CategoryService } from './services/category-service.service';
import { RecordService } from './services/record.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AlertDialogComponent } from './components/alert-dialog/alert-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProfileComponent } from './components/profile/profile.component';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { NgChartsModule } from 'ng2-charts';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ReportsComponent } from './components/reports/reports.component';
import { TransactionDialogComponent } from './components/transaction-dialog/transaction-dialog.component';
import { CalendarComponent } from './components/calendar/calendar.component';
import { SplashComponent } from './splash/splash.component';

@NgModule({
  declarations: [
    AppComponent,
    CategoryListComponent,
    CategoryUpsertComponent,
    AccountsItemsComponent,
    AccountsUpsertComponent,
    AddExpenseComponent,
    SidebarComponent,
    RecordsComponent,
    RecordUpsertComponent,
    ConfirmDialogComponent,
    AlertDialogComponent,
    DashboardComponent,
    ProfileComponent,
    ReportsComponent,
    TransactionDialogComponent,
    CalendarComponent,
    SplashComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    BrowserModule,
    MatDialogModule,
    MatMenuModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    BrowserAnimationsModule,
    CurrencyPipe,
    CommonModule,

    MatTableModule,

    MatFormFieldModule,
    MatSelectModule,
    MatButtonToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgChartsModule,
  ],
  providers: [AccountServiceService, CategoryService, RecordService, DatePipe],
  bootstrap: [AppComponent],
})
export class AppModule {}
