import { TestBed } from '@angular/core/testing';

import { SolidService } from './solid.service';

describe('SolidAuthService', () => {
    let service: SolidService;
    // let session: Observable<SolidSession>;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(SolidService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    // it('can test HttpClient.get', async () => {
    //     // const user: User = {username: 'test', password: 'test'};
    //     // const id = "1";
    //     let loggedIn = false;
      
    //     await service.solidLogin();
      
    //     // Assert that the request is a GET.
    //     expect(loggedIn).toEqual(true);
    // });
});
