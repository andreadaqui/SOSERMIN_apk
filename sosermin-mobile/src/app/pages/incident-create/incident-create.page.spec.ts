import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IncidentCreatePage } from './incident-create.page';

describe('IncidentCreatePage', () => {
  let component: IncidentCreatePage;
  let fixture: ComponentFixture<IncidentCreatePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(IncidentCreatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
