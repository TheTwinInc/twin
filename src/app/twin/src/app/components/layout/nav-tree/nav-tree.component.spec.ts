import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavTreeComponent } from './nav-tree.component';

describe('NavTreeComponent', () => {
  let component: NavTreeComponent;
  let fixture: ComponentFixture<NavTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavTreeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NavTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
