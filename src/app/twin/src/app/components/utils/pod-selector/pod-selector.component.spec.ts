import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PodSelectorComponent } from './pod-selector.component';

describe('PodSelectorComponent', () => {
  let component: PodSelectorComponent;
  let fixture: ComponentFixture<PodSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PodSelectorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PodSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
