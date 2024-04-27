import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router, ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';

import { AccountService } from '../../services';
import { User } from '../../models';

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

    constructor(private accountService: AccountService) {
        this.accountService.user.subscribe(x => this.user = x);
    }

    logout() {
        this.accountService.logout();
    }
}
