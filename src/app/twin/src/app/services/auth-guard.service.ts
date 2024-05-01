import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { SolidAccountService } from '@app/services';

export function authGuardService(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const router = inject(Router);
    const accountService = inject(SolidAccountService);
    const session = accountService.sessionValue;
    let userAuthorised = false;
    
    if (session) {
        console.log(`Session login: ${session?.info.isLoggedIn}`)
        // authorised so return true
        userAuthorised =  true;
    } else {
        // not logged in so redirect to login page with the return url
        router.navigate(['/account/callback'], { queryParams: { returnUrl: state.url } });
    }
    return userAuthorised;
}