import { inject } from '@angular/core';
import { HttpRequest, HttpHandlerFn } from '@angular/common/http';

import { environment } from '@environments/environment';
import { AccountService } from '@app/services';

export function jwtInterceptor(request: HttpRequest<any>, next: HttpHandlerFn) {
    // add auth header with jwt if user is logged in and request is to the api url
    const accountService = inject(AccountService);
    const user = accountService.userValue;
    const isLoggedIn = user?.token;
    const isApiUrl = request.url.startsWith(environment.apiUrl);
    if (isLoggedIn && isApiUrl) {
        request = request.clone({
            setHeaders: { Authorization: `Bearer ${user.token}` }
        });
    }

    return next(request);
}
// import { Injectable } from '@angular/core';
// import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
// import { Observable } from 'rxjs';

// import { environment } from '@environments/environment';
// import { AccountService } from '@app/services';

// @Injectable()
// export class JwtInterceptor implements HttpInterceptor {
//     constructor(private accountService: AccountService) { }

//     intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
//         // add auth header with jwt if user is logged in and request is to the api url
//         const user = this.accountService.userValue;
//         const isLoggedIn = user?.token;
//         const isApiUrl = request.url.startsWith(environment.apiUrl);
//         if (isLoggedIn && isApiUrl) {
//             request = request.clone({
//                 setHeaders: { Authorization: `Bearer ${user.token}` }
//             });
//         }

//         return next.handle(request);
//     }
// }