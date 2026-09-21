import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { HomeClientComponent } from './home-client.component';

describe('HomeClientComponent', () => {
  let component: HomeClientComponent;
  let fixture: ComponentFixture<HomeClientComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HomeClientComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeClientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
