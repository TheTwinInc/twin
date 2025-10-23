import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileKnowsListComponent } from './profile-knows-list.component';

describe('ProfileKnowsListComponent', () => {
  let component: ProfileKnowsListComponent;
  let fixture: ComponentFixture<ProfileKnowsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileKnowsListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProfileKnowsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
