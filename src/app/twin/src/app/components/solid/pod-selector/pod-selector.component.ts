import { Component, forwardRef, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { IContainedResource } from '@app/interfaces';
import { LoggerService, SolidAuthService, SolidDataService } from '@app/services';
import { UrlString } from '@inrupt/solid-client';
import { ISessionInfo } from '@inrupt/solid-client-authn-browser';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-pod-selector',
    imports: [
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule
    ],
    templateUrl: './pod-selector.component.html',
    styleUrl: './pod-selector.component.css',
    standalone: true,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => PodSelectorComponent),
            multi: true
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => PodSelectorComponent),
            multi: true
        }
    ]
})
export class PodSelectorComponent implements OnInit, OnDestroy {
    private readonly ngUnsubscribe: Subject<any> = new Subject<any>();
    public formGroup!: UntypedFormGroup;
    sessionInfo?: ISessionInfo | null;
    pods?: UrlString[] | any[];
    selectedPod?: UrlString | any;
    containedResources?: IContainedResource[] | null;

    constructor(
        private solidAuthService: SolidAuthService,
        private solidDataService: SolidDataService,
        private logger: LoggerService,
        private fb: UntypedFormBuilder,
    ) { }

    ngOnInit(): void {
        this.solidAuthService.sessionInfo
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(x => {
                this.sessionInfo = x;
                this.onSessionChange(this.sessionInfo);
            });
        this.formGroup = this.fb.group({
            podSelector: [null],
        });
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next(null);
        this.ngUnsubscribe.unsubscribe();
    }

    async onSessionChange (sessionInfo: any) {
        if (sessionInfo?.isLoggedIn) {
            this.pods = await this.solidDataService.getAllPods(sessionInfo.webId);
        }
    }

    async getDataset() {
        try {
            if (undefined != this.selectedPod) {
                let solidDataset = await this.solidDataService.getDataset(`${this.selectedPod}`);
                this.solidDataService.setContainedResources(solidDataset);
                
            }
        } catch (error) {
            this.logger.error(error);
        }
    }

    async getDatasetAsTurtle() {
        try {
            if (undefined != this.selectedPod) {
                let solidDataset = await this.solidDataService.getDataset(`${this.selectedPod}`);
                this.solidDataService.setContainedResources(solidDataset);
                // this.solidDataService.getThingAll(solidDataset);
            }
        } catch (error) {
            this.logger.error(error);
        }
    }

    async setPodContainedResources(pod: any) {
        
        
        // let solidDataset = await this.solidDataService.getDataset(`${pod}`);
        // const containedResources = this.solidDataService.getContainedResources(solidDataset);
        // const rootResource: IContainedResource = {
        //     url: sessionInfo.webId,
        //     name: 'root'
        // }
        // this.solidDataService.setAssetsGraph(rootResource, containedResources);
        try {
            this.selectedPod = pod;
            // this.logger.info(`PS: Selected Pod: ${JSON.stringify(pod)}`);
            if (this.sessionInfo?.isLoggedIn && undefined != this.sessionInfo.webId && undefined != this.selectedPod) {
                let solidDataset = await this.solidDataService.getDataset(`${this.selectedPod}`);
                const containedResources = this.solidDataService.getContainedResources(solidDataset);
                const rootResource: IContainedResource = {
                    url: this.sessionInfo.webId,
                    name: 'root'
                }
                this.solidDataService.setAssetsGraph(rootResource, containedResources);
                this.solidDataService.setContainedResources(solidDataset);
                
            }
        } catch (error) {
            this.logger.error(error);
        }
        // await this.getDataset();
    }
}
