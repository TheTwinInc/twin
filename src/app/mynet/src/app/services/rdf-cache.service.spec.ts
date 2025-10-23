import { TestBed } from '@angular/core/testing';

import { RdfCacheService } from './rdf-cache.service';

describe('RdfCacheService', () => {
  let service: RdfCacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RdfCacheService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
