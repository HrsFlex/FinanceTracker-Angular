import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LoginComponent } from './pages/login/login.component';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';

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
import { HomeComponent } from './pages/home/home.component';
import { AddExpenseComponent } from './components/add-expense/add-expense.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { RecordsComponent } from './components/records/record-list/records.component';
import { RecordUpsertComponent } from './components/records/record-upsert/record-upsert.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    NavBarComponent,
    HomeComponent,
    CategoryListComponent,
    CategoryUpsertComponent,
    AccountsItemsComponent,
    AccountsUpsertComponent,
    AddExpenseComponent,
    SidebarComponent,
    RecordsComponent,
    RecordUpsertComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    // Material modules
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
