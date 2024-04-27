import { inject } from '@angular/core';
import { HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AccountService } from '@app/services';

export function errorInterceptor(request: HttpRequest<any>, next: HttpHandlerFn) {
    const accountService = inject(AccountService);
    return next(request).pipe(catchError(err => {
        if ([401, 403].includes(err.status) && accountService.userValue) {
            // auto logout if 401 or 403 response returned from api
            accountService.logout();
        }

        const error = err.error?.message || err.statusText;
        console.error(err);
        return throwError(() => error);
    }))
}
// import { Injectable } from '@angular/core';
// import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
// import { Observable, throwError } from 'rxjs';
// import { catchError } from 'rxjs/operators';

// import { AccountService } from '@app/services';

// @Injectable()
// export class ErrorInterceptor implements HttpInterceptor {
//     constructor(private accountService: AccountService) { }

//     intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
//         return next.handle(request).pipe(catchError(err => {
//             if ([401, 403].includes(err.status) && this.accountService.userValue) {
//                 // auto logout if 401 or 403 response returned from api
//                 this.accountService.logout();
//             }

//             const error = err.error?.message || err.statusText;
//             console.error(err);
//             return throwError(() => error);
//         }))
//     }
// }