import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ISessionInfo } from '@inrupt/solid-client-authn-browser';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { AlarmService, SolidAuthService, LoggerService, ScreenService } from '@app/services';
import { SolidDataset } from '@inrupt/solid-client';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '@app/components';
import { SCREEN_SIZE } from '@app/config';
import { SizeDetectorComponent } from "@app/components";
import { ContentComponent } from "../content/content.component";

@Component({
    selector: 'app-home',
    imports: [
    // NgIf,
    RouterOutlet,
    HeaderComponent,
    SizeDetectorComponent,
    // ContentComponent
],
    templateUrl: './app-home.component.html',
    styleUrl: './app-home.component.css',
    standalone: true
})
export class AppHomeComponent implements OnInit, OnDestroy {
    private readonly ngUnsubscribe: Subject<any> = new Subject<any>();
    sessionInfo?: ISessionInfo | null;
    isMobile?: boolean | null;
    dataItems?: any[];
    hideMobile: boolean = false;

    constructor(
        private solidAuthService: SolidAuthService,
        private screenService: ScreenService
    ) { }
    
    ngOnInit() {
        this.solidAuthService.sessionInfo
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(x => {
                this.sessionInfo = x;
            });
        this.screenService.isMobile
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(x => {
                this.isMobile = x;
                this.onScreenSizeUpdate();
            });
        this.solidAuthService.handleSessionRestore();
        this.dataItems = [];
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next(null);
        this.ngUnsubscribe.unsubscribe();
    }

    onScreenSizeUpdate() {
        if (this.isMobile) {
            this.hideMobile = true;
        } else {
            this.hideMobile = false;
        }
        
    }
}
    

    
