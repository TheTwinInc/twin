import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdentityProviderDialogComponent } from './identity-provider-dialog.component';

describe('IdentityProviderDialogComponent', () => {
  let component: IdentityProviderDialogComponent;
  let fixture: ComponentFixture<IdentityProviderDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IdentityProviderDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IdentityProviderDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
