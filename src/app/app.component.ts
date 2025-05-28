// src/app/app.component.ts
import { Component, ViewChild } from '@angular/core';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { DialogService } from './services/dialog.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'FinanceTracker';
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;

  constructor(private dialogService: DialogService) {}
}
