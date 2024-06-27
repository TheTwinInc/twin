import { Component, OnInit, OnDestroy } from '@angular/core';
// import { NgIf } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';

import { AccountService, LoggerService, SolidService } from '@app/services';
import { User } from '@app/models';

import { Session, ISessionInfo } from '@inrupt/solid-client-authn-browser';

@Component({
    selector: 'app-header',
    standalone: true,
    // imports: [NgIf, RouterLink, RouterLinkActive],
    imports: [
        // NgIf,
        RouterLink,
        RouterLinkActive,
        MatToolbarModule,
        MatButtonModule
    ],
    templateUrl: './header.component.html',
    styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
    private readonly ngUnsubscribe: Subject<any> = new Subject<any>();
    user?: User | null;
    sessionInfo?: ISessionInfo | null;
    dataSetContent?:string;

    constructor(
        private accountService: AccountService,
        private solidService: SolidService,
        private logger: LoggerService
    ) { }

    ngOnInit(): void {
        this.accountService.user
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(x => this.user = x);
        this.solidService.sessionInfo
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(x => {
                this.sessionInfo = x;
                this.onSessionChange(this.sessionInfo);
            });
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next(null);
        this.ngUnsubscribe.unsubscribe();
    }

    logout() {
        this.accountService.logout();
    }

    loginApp() {
        this.solidService.solidLogin();
    }

    async logoutApp() {
        await this.solidService.solidLogoutApp();
    }

    async logoutIdp() {
        await this.solidService.solidLogoutIdp();
    }

    async onSessionChange (sessionInfo: any) {
        // if (sessionInfo?.isLoggedIn) {
        //     let pods = await this.solidService.getAllPods(sessionInfo.webId);
        //     this.logger.info(`PODS: ${JSON.stringify(pods)}`);
        //     let dataSet = await this.solidService.getDataSet("https://thetwin.stage.graphmetrix.net/");
        //     this.logger.info(`DATASET: ${JSON.stringify(dataSet)}`);
        // } else {
        //     // this.router.navigate(['account/callback']);
        // }
    }
}
