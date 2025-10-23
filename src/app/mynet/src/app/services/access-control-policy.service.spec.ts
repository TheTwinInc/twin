import { TestBed } from '@angular/core/testing';

import { AccessControlPolicyService } from './access-control-policy.service';

describe('AccessControlPolicyService', () => {
  let service: AccessControlPolicyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AccessControlPolicyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
