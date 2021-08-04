import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StakeUnlockComponent } from './stake-unlock.component';

describe('ValidatorsComponent', () => {
  let component: StakeUnlockComponent;
  let fixture: ComponentFixture<StakeUnlockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StakeUnlockComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StakeUnlockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
