import { Component } from '@angular/core';
import { MatSidenavModule}  from '@angular/material/sidenav';
import { IContainedResource } from '@app/interfaces';
import { LoggerService, SolidService } from '@app/services';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-nav',
    standalone: true,
    imports: [ MatSidenavModule ],
    templateUrl: './app-nav.component.html',
    styleUrl: './app-nav.component.css'
})
export class AppNavComponent {
    private readonly ngUnsubscribe: Subject<any> = new Subject<any>();
    containedResources?: IContainedResource[] | null;

    constructor(
        private solidService: SolidService,
        private logger: LoggerService,
    ) { }

    ngOnInit() {
        this.solidService.containedResources
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(x => {
                this.containedResources = x;
                this.onSessionChange(this.containedResources);
            });
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next(null);
        this.ngUnsubscribe.unsubscribe();
    }

    async onSessionChange (sessionInfo: any) {
        if (sessionInfo?.isLoggedIn) {
            try {
                this.logger.info(`Nav changed`);
            } catch (error) {
                this.logger.error(error);
            }
        }
    }

    navigateResource(url: string) {
        this.logger.info(`Navigate url ${url}`);
    }

}


