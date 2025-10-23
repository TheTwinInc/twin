import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileKnowsEditorComponent } from './profile-knows-editor.component';

describe('ProfileKnowsEditorComponent', () => {
  let component: ProfileKnowsEditorComponent;
  let fixture: ComponentFixture<ProfileKnowsEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileKnowsEditorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProfileKnowsEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
