import { TestBed } from '@angular/core/testing';

import { SolidProfileService } from './solid-profile.service';

describe('SolidProfileService', () => {
  let service: SolidProfileService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SolidProfileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
