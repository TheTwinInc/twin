import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ISessionInfo } from '@inrupt/solid-client-authn-browser';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { AlarmService, SolidAuthService, LoggerService } from '@app/services';
import { SolidDataset } from '@inrupt/solid-client';
import { RouterOutlet } from '@angular/router';
import { AppSidebarComponent, FooterComponent, HeaderComponent, NavTreeComponent } from '@app/components';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [
        RouterOutlet,
        HeaderComponent,
        FooterComponent,
        AppSidebarComponent,
        NavTreeComponent,
    ],
    templateUrl: './app-home.component.html',
    styleUrl: './app-home.component.css'
})
export class AppHomeComponent implements OnInit, OnDestroy {
    private readonly ngUnsubscribe: Subject<any> = new Subject<any>();
    sessionInfo?: ISessionInfo | null;
    dataItems?: any[];

    constructor(
        private solidAuthService: SolidAuthService,
    ) { }
    
    ngOnInit() {
        this.solidAuthService.sessionInfo
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(x => {
                this.sessionInfo = x;
            });
        this.solidAuthService.handleSessionRestore();
        this.dataItems = [];
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next(null);
        this.ngUnsubscribe.unsubscribe();
    }
}
    

    
