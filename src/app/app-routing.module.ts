import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { CategoryListComponent } from './components/category/category-list/category-list.component';
import { CategoryUpsertComponent } from './components/category/category-upsert/category-upsert.component';
import { AccountsItemsComponent } from './components/accounts/accounts-items/accounts-items.component';
import { AccountsUpsertComponent } from './components/accounts/accounts-upsert/accounts-upsert.component';
import { HomeComponent } from './pages/home/home.component';

const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'category-list', component: CategoryListComponent },
  { path: 'category-upsert/:id', component: CategoryUpsertComponent },
  { path: 'category-upsert', component: CategoryUpsertComponent },
  { path: 'accounts-items', component: AccountsItemsComponent },
  { path: 'accounts-upsert', component: AccountsUpsertComponent },
  { path: 'accounts-upsert/:id', component: AccountsUpsertComponent },
  { path: 'app-home', component: HomeComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
