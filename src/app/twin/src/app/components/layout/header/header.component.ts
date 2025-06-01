import { Component, OnInit, OnDestroy, forwardRef } from '@angular/core';
import { NgOptimizedImage } from '@angular/common'
// import { NgIf } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';

import { AccountService, LoggerService, SolidAuthService, SolidDataService } from '@app/services';
import { User } from '@app/models';

import { Session, ISessionInfo } from '@inrupt/solid-client-authn-browser';
import { MatCardModule } from '@angular/material/card';
import { FormsModule, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { SolidDataset, UrlString, WithServerResourceInfo } from '@inrupt/solid-client';
import { MatDividerModule } from '@angular/material/divider';
import { PodSelectorComponent } from "../../solid/pod-selector/pod-selector.component";

@Component({
    selector: 'app-header',
    standalone: true,
        imports: [
        RouterLink,
        RouterLinkActive,
        MatToolbarModule,
        MatButtonModule,
        NgOptimizedImage,
        MatCardModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatButtonModule,
        MatDividerModule,
        MatInputModule,
        PodSelectorComponent
    ],
    templateUrl: './header.component.html',
    styleUrl: './header.component.css',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => HeaderComponent),
            multi: true
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => HeaderComponent),
            multi: true
        }
    ]
})
export class HeaderComponent implements OnInit, OnDestroy {
    private readonly ngUnsubscribe: Subject<any> = new Subject<any>();
    user?: User | null;
    sessionInfo?: ISessionInfo | null;
    dataSetContent?:string;
    pods?: UrlString[] | any[];
    selectedPod?: UrlString | any;
    dataset?: SolidDataset & WithServerResourceInfo;
    profile: { name: string; email: string } | null = null;

    constructor(
        private accountService: AccountService,
        private solidAuthService: SolidAuthService,
        private solidDataService: SolidDataService,
        private logger: LoggerService
    ) { }

    async ngOnInit() {
        this.accountService.user
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(x => this.user = x);
        this.solidAuthService.sessionInfo
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(x => {
                this.sessionInfo = x;
                this.onSessionChange(this.sessionInfo);
            });
        // if (this.solidAuthService.isLoggedIn()) {
        //     // this.profile = await this.solidAuthService.loadProfileData();
        // }
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next(null);
        this.ngUnsubscribe.unsubscribe();
    }

    logout() {
        this.accountService.logout();
    }

    loginApp() {
        const issuer = "https://stage.graphmetrix.net";
        this.solidAuthService.solidLogin(issuer);
    }

    async logoutApp() {
        await this.solidAuthService.logoutApp();
    }

    async logoutIdp() {
        await this.solidAuthService.solidLogoutIdp();
    }

    async onSessionChange (sessionInfo: any) {
        if (sessionInfo?.isLoggedIn) {
            // this.profile = await this.solidAuthService.loadProfileData();
        }
    }

    async getDataset() {
        try {
            if (undefined != this.selectedPod) {
                let solidDataset;
                solidDataset = await this.solidDataService.getDataset(`${this.selectedPod}`);
                this.solidDataService.setContainedResources(solidDataset);
                this.dataset = solidDataset;
            }
        } catch (error) {
            this.logger.error(error);
        }
    }
}
