import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountsUpsertComponent } from './accounts-upsert.component';

describe('AccountsUpsertComponent', () => {
  let component: AccountsUpsertComponent;
  let fixture: ComponentFixture<AccountsUpsertComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AccountsUpsertComponent]
    });
    fixture = TestBed.createComponent(AccountsUpsertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
