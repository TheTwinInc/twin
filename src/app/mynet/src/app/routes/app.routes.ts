import { Routes } from "@angular/router";

import { 
    AppHomeComponent,
    CallbackComponent,
    OnboardingComponent,
    ProfileHomeComponent,
    ProfileCardComponent,
    ProfileKnowsListComponent,
    NodeComponent 
} from '@app/components';
import {  } from "@app/components/nodes/node/node.component";
import { authGuardService } from '@app/services';

export const APP_ROUTES: Routes = [
    { path: '', component: AppHomeComponent, canActivate: [authGuardService] },
    { path: 'account/onboarding', component: OnboardingComponent},
    { path: 'account/callback', component: CallbackComponent },
    { path: 'profile', component: ProfileHomeComponent },
    { path: 'profile/contacts', component: ProfileKnowsListComponent },
    { path: 'profile/card', component: ProfileCardComponent },
    { path: 'nodes/node', component: NodeComponent },

    // otherwise redirect to home
    // { path: '**', redirectTo: 'solid/profile' }
    { path: '**', redirectTo: 'account/callback' }
];