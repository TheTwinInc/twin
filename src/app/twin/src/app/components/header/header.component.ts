import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
// import { Router, ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';

import { AccountService, SolidAccountService } from '@app/services';
import { User } from '@app/models';
import { openLoginDialog } from '@app/components';

@Component({
    selector: 'app-header',
    standalone: true,
    // imports: [NgIf, RouterLink, RouterLinkActive],
    imports: [
        NgIf,
        RouterLink,
        RouterLinkActive,
        MatToolbarModule,
        MatButtonModule
    ],
    templateUrl: './header.component.html',
    styleUrl: './header.component.css'
})
export class HeaderComponent {
    user?: User | null;

    constructor(
        private accountService: AccountService,
        private solidAccountService: SolidAccountService,
        private dialog: MatDialog,
    ) {
        this.accountService.user.subscribe(x => this.user = x);
    }

    logout() {
        this.accountService.logout();
    }

    // login() {
    //     openLoginDialog(this.dialog)
    //     .pipe(
    //         filter((val: any) => !!val)
    //     )
    //     .subscribe(
    //         (val: any) => {
    //             console.log(`LD: Login please... ${JSON.stringify(val)}`);
    //             // this.updateFlightDetails(val);
    //         }
    //     );
    // }
    login() {
        this.solidAccountService.solidLogin();
    }
    logoutApp() {
        this.solidAccountService.solidLogoutApp();
    }
    logoutIdp() {
        this.solidAccountService.solidLogoutIdp();
    }
}
