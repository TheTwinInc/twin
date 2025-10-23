import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ISessionInfo } from '@inrupt/solid-client-authn-browser';

import { AlarmService, SolidAuthService, LoggerService, RdfService, ContactService, SolidProfileService } from '@app/services';


@Component({
    selector: 'app-callback',
    imports: [],
    templateUrl: './callback.component.html',
    styleUrl: './callback.component.css',
    standalone: true
})
export class CallbackComponent implements OnInit, OnDestroy {
    private readonly ngUnsubscribe: Subject<any> = new Subject<any>();
    sessionInfo?: ISessionInfo | null;

    constructor(
        private solidAuthService: SolidAuthService,
        private solidProfileService: SolidProfileService,
        private rdfService: RdfService,
        private alarmService: AlarmService,
    ) {
        this.getSessionInfo();
    }

    ngOnInit(): void {
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next(null);
        this.ngUnsubscribe.unsubscribe();
    }

    getSessionInfo(): void {
        this.solidAuthService.sessionInfo
        .pipe(
            takeUntil(this.ngUnsubscribe)
        )
        .subscribe(x => {
            this.sessionInfo = x;
            this.onSessionChange(this.sessionInfo);
        });
        this.alarmService.success('Connected to server', true);
        this.solidAuthService.handleSessionRestore();
    }

    async onSessionChange (sessionInfo: any): Promise<void> {
        if (this.sessionInfo?.isLoggedIn) {
            await this.reloadProfile();
            this.rdfService.loadResource(this.sessionInfo?.webId);
        }
    }

    async reloadProfile(): Promise<void> {
        if (this.solidAuthService.isLoggedIn()) {
            const profile = await this.solidProfileService.getProfile();
        }
    }
}
