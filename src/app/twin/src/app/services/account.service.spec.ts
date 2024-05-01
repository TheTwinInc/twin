import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController  } from '@angular/common/http/testing';

import { AccountService } from './account.service';
import { User } from '@app/models';

describe('AccountService', () => {
    let service: AccountService;
    let httpTestingController: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule]
        });
        service = TestBed.inject(AccountService);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        // After every test, assert that there are no more pending requests.
        httpTestingController.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    // it('can test HttpClient.get', () => {
    //     const user: User = {username: 'test', password: 'test'};
    //     const id = "1";
    //     let loggedIn = false;
      
    //     service.login('test', 'test')
    //         .subscribe({
    //             next: () => {
    //                 loggedIn = true;
    //             }
    //         });
      
    //     // Assert that the request is a GET.
    //     expect(loggedIn).toEqual(true);
    // });
});
