import { TestBed } from '@angular/core/testing';

import { AccessControlListService } from './access-control-list.service';

describe('AccessControlRdfService', () => {
  let service: AccessControlListService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AccessControlListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
