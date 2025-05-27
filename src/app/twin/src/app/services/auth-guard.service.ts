import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { SolidAuthService, LoggerService } from '@app/services';

export function authGuardService(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const router = inject(Router);
    const accountService = inject(SolidAuthService);
    const logger = inject(LoggerService);
    const sessionInfo = accountService.sessionInfoValue;
    let userAuthorised = false;
    
    if (sessionInfo?.isLoggedIn) {
        // authorised so return true
        userAuthorised =  true;
    } else {
        // not logged in so redirect to login page with the return url
        router.navigate(['/account/callback'], { queryParams: { returnUrl: state.url } });
    }
    return userAuthorised;
}