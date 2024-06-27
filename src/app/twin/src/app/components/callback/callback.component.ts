import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ISessionInfo } from '@inrupt/solid-client-authn-browser';

import { AlarmService, SolidService, LoggerService } from '@app/services';


@Component({
    selector: 'app-callback',
    standalone: true,
    imports: [],
    templateUrl: './callback.component.html',
    styleUrl: './callback.component.css'
})
export class CallbackComponent implements OnInit, OnDestroy {
    private readonly ngUnsubscribe: Subject<any> = new Subject<any>();
    sessionInfo?: ISessionInfo | null;

    constructor(
        private solidService: SolidService,
        private alarmService: AlarmService,
        private router: Router,
        private logger: LoggerService,
    ) { }

    ngOnInit() {
        this.solidService.sessionInfo
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(x => {
                this.sessionInfo = x;
                this.onSessionChange(this.sessionInfo);
            });
        this.alarmService.success('Connected to server', true);
        this.solidService.handleSessionRestore();
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next(null);
        this.ngUnsubscribe.unsubscribe();
    }

    onSessionChange (sessionInfo: any) {
        if (sessionInfo?.isLoggedIn) {
            this.router.navigate(['/sandbox']);
        } else {
            this.router.navigate(['account/callback']);
        }
    }
}
