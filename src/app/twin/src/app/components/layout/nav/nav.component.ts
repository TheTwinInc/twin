import { Component } from '@angular/core';
import { MatSidenavModule}  from '@angular/material/sidenav';
import { IContainedResource } from '@app/interfaces';
import { LoggerService, SolidAuthService, SolidDataService } from '@app/services';
import { ISessionInfo } from '@inrupt/solid-client-authn-browser';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-nav',
    standalone: true,
    imports: [ MatSidenavModule ],
    templateUrl: './nav.component.html',
    styleUrl: './nav.component.css'
})
export class NavComponent {
    private readonly ngUnsubscribe: Subject<any> = new Subject<any>();
    containedResources?: IContainedResource[] | null;
    sessionInfo?: ISessionInfo | null;
    emptyContainedResources: IContainedResource[] = [];

    constructor(
        private solidAuthService: SolidAuthService,
        private solidDataService: SolidDataService,
        private logger: LoggerService,
    ) { }

    ngOnInit() {
        this.solidAuthService.sessionInfo
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(x => {
                this.sessionInfo = x;
                this.onSessionChange(this.sessionInfo);
            });
        this.solidDataService.containedResources
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(x => {
                this.containedResources = x;
                this.logger.debug(`NAV: Update contained resources`);
            });
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next(null);
        this.ngUnsubscribe.unsubscribe();
    }

    async onSessionChange (sessionInfo: any) {
        if (!sessionInfo?.isLoggedIn) {
            this.containedResources = this.emptyContainedResources;
        }
    }

    async navigateResource(resource: IContainedResource) {
        // this.logger.info(`Navigate url ${resource.url}`);
        let dataset = await this.solidDataService.getDataset(resource.url);
        this.solidDataService.getThingAll(dataset);
        let containedResources = this.solidDataService.getContainedResources(dataset);
        this.solidDataService.setAssetsGraph(resource, containedResources);
    }
}


