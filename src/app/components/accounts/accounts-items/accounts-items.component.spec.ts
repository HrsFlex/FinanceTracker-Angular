import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountsItemsComponent } from './accounts-items.component';

describe('AccountsItemsComponent', () => {
  let component: AccountsItemsComponent;
  let fixture: ComponentFixture<AccountsItemsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AccountsItemsComponent]
    });
    fixture = TestBed.createComponent(AccountsItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
