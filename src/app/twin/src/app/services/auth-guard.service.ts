import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { SolidService, LoggerService } from '@app/services';

export function authGuardService(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const router = inject(Router);
    const accountService = inject(SolidService);
    const logger = inject(LoggerService);
    const sessionInfo = accountService.sessionInfoValue;
    let userAuthorised = false;
    
    if (sessionInfo?.isLoggedIn) {
        logger.debug(`Session login: ${sessionInfo?.isLoggedIn}`)
        // authorised so return true
        userAuthorised =  true;
    } else {
        // not logged in so redirect to login page with the return url
        router.navigate(['/account/callback'], { queryParams: { returnUrl: state.url } });
    }
    return userAuthorised;
}