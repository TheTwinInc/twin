import { Routes } from "@angular/router";

// import { AppHomeComponent } from './home';
import { AppHomeComponent, LoginComponent, RegisterComponent } from '../components';
import { authGuard } from '../helpers';

const usersRoutes = () => import('./users.routes').then(x => x.USERS_ROUTES);

export const APP_ROUTES: Routes = [
    { path: '', component: AppHomeComponent, canActivate: [authGuard] },
    { path: 'users', loadChildren: usersRoutes, canActivate: [authGuard] },
    { path: 'account/login', component: LoginComponent },
    { path: 'account/register', component: RegisterComponent },

    // otherwise redirect to home
    { path: '**', redirectTo: '' }
];