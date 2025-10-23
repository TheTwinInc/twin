import { Component, OnInit, OnDestroy, forwardRef } from '@angular/core';
import { NgOptimizedImage } from '@angular/common'
// import { NgIf } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { LoggerService, SolidAuthService, SolidDataService } from '@app/services';
import { User } from '@app/models';

import { Session, ISessionInfo } from '@inrupt/solid-client-authn-browser';
import { MatCardModule } from '@angular/material/card';
import { FormsModule, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { SolidDataset, UrlString, WithServerResourceInfo } from '@inrupt/solid-client';
import { MatDividerModule } from '@angular/material/divider';


@Component({
    selector: 'app-header',
    imports: [
        RouterLink,
        RouterLinkActive,
        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        NgOptimizedImage,
        MatCardModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatDividerModule,
        MatInputModule,
    ],
    templateUrl: './header.component.html',
    styleUrl: './header.component.css',
    standalone: true,
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
        private solidAuthService: SolidAuthService,
        private solidDataService: SolidDataService,
        private logger: LoggerService
    ) { }

    async ngOnInit() {
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
