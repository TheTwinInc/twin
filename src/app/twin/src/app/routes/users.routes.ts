import { Routes } from '@angular/router';

import { UsersListComponent } from '../components/users-list/users-list.component';
import { UserComponent } from '../components/user/user.component';

export const USERS_ROUTES: Routes = [
    { path: '', component: UsersListComponent },
    { path: 'add', component: UserComponent },
    { path: 'edit/:id', component: UserComponent }
];