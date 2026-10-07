import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoanComponent } from './loan.component';
import { provideTestProviders } from '../../testing/test-providers';

describe('LoanComponent', () => {
  let component: LoanComponent;
  let fixture: ComponentFixture<LoanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoanComponent],
      providers: provideTestProviders(),
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
