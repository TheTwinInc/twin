import { TestBed } from '@angular/core/testing';

import { SolidDataService } from './solid-data.service';

describe('SolidDataService', () => {
  let service: SolidDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SolidDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
