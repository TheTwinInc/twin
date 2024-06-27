import { Routes } from "@angular/router";

// import { AppHomeComponent } from './home';
// import { AppHomeComponent, LoginComponent, LogoutComponents, RegisterComponent, CallbackComponent } from '../components';
import { AppHomeComponent, LoginComponent, LogoutComponent, RegisterComponent, CallbackComponent } from '@app/components';
import { authGuard } from '../helpers';
import { authGuardService } from '@app/services';
import { SandboxComponent } from "@app/components/sandbox/sandbox.component";

const usersRoutes = () => import('./users.routes').then(x => x.USERS_ROUTES);

export const APP_ROUTES: Routes = [
    { path: '', component: AppHomeComponent, canActivate: [authGuardService] },
    { path: 'sandbox', component: SandboxComponent, canActivate: [authGuardService] },
    // { path: 'users', loadChildren: usersRoutes, canActivate: [authGuardService] },
    // { path: '', component: AppHomeComponent, canActivate: [authGuard] },
    // { path: 'users', loadChildren: usersRoutes, canActivate: [authGuard] },
    { path: 'account/login', component: LoginComponent },
    { path: 'account/logout', component: LogoutComponent },
    { path: 'account/register', component: RegisterComponent },
    { path: 'account/callback', component: CallbackComponent },

    // otherwise redirect to home
    { path: '**', redirectTo: '' }
];