import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileThumbnailPickerComponent } from './profile-thumbnail-picker.component';

describe('ProfileThumbnailPickerComponent', () => {
  let component: ProfileThumbnailPickerComponent;
  let fixture: ComponentFixture<ProfileThumbnailPickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileThumbnailPickerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProfileThumbnailPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
