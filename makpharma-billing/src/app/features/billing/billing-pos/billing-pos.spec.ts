import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillingPos } from './billing-pos';

describe('BillingPos', () => {
  let component: BillingPos;
  let fixture: ComponentFixture<BillingPos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillingPos],
    }).compileComponents();

    fixture = TestBed.createComponent(BillingPos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
