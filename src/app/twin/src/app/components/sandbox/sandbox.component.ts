import { Component, OnInit, OnDestroy, forwardRef } from '@angular/core';
// import { NgIf, NgFor } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ISessionInfo } from '@inrupt/solid-client-authn-browser';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AbstractControl, FormsModule, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule , UntypedFormBuilder, UntypedFormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';

import { AlarmService, SolidAuthService, LoggerService, RdfService, HighlightService, SolidDataService } from '@app/services';
import { SolidDataset, Thing, UrlString, WithServerResourceInfo } from '@inrupt/solid-client';
import { IContainedResource } from '@app/interfaces';
import { PodSelectorComponent } from '@app/components';


@Component({
    selector: 'app-sandbox',
    standalone: true,
    imports: [
        MatCardModule,
        MatIconModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatButtonModule,
        MatDividerModule,
        MatListModule,
        PodSelectorComponent
    ],
    templateUrl: './sandbox.component.html',
    styleUrl: './sandbox.component.css',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SandboxComponent),
            multi: true
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => SandboxComponent),
            multi: true
        }
    ]
})
export class SandboxComponent {
    private readonly ngUnsubscribe: Subject<any> = new Subject<any>();
    public sandboxForm!: UntypedFormGroup;
    sessionInfo?: ISessionInfo | null;
    dataItems?: any[];
    pods?: UrlString[] | any[];
    selectedPod?: UrlString | any;
    items?: UrlString[] | any[];
    turtleText: any;
    containedResources?: IContainedResource[] | null;
    dataset?: SolidDataset & WithServerResourceInfo;
    things?: Thing[] | null;

    constructor(
        private solidAuthService: SolidAuthService,
        private solidDataService: SolidDataService,
        private alarmService: AlarmService,
        private logger: LoggerService,
        private rdf: RdfService,
        private fb: UntypedFormBuilder,
        private highlightService: HighlightService
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
            });
        this.solidDataService.things
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(x => {
                this.things = x;
            });
        this.solidAuthService.handleSessionRestore();
        this.dataItems = [];
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next(null);
        this.ngUnsubscribe.unsubscribe();
    }

    public onTouched: () => void = () => {};
    
    writeValue(val: any): void {
        val && this.sandboxForm.setValue(val, { emitEvent: false });
    }

    registerOnChange(fn: any): void {
        this.logger.debug("on change");
        this.sandboxForm.valueChanges.subscribe(fn);
    }
    
    registerOnTouched(fn: any): void {
        this.logger.debug("on blur");
        this.onTouched = fn;
    }

    setDisabledState?(isDisabled: boolean): void {
        isDisabled ? this.sandboxForm.disable() : this.sandboxForm.enable();
    }

    validate(c: AbstractControl): ValidationErrors | null{
        console.log("sandbox validation", c);
        return this.sandboxForm.valid ? null : { invalidForm: {valid: false, message: "sandboxForm fields are invalid"}};
    }

    get f() {
        return this.sandboxForm.controls;
    }

    async onSessionChange (sessionInfo: any) {
        if (sessionInfo?.isLoggedIn) {
            try {
                this.pods = await this.solidDataService.getAllPods(sessionInfo.webId);
                // this.logger.info(`PODS: ${JSON.stringify(this.pods)}`);
            } catch (error) {
                this.logger.error(error);
            }
        }
    }

    // async getDocuments() {
    //     try {
    //         if (undefined != this.selectedPod) {
    //             // let dataset: any[];
                
    //             let solidDataset: SolidDataset;
        
    //             solidDataset = await this.solidService.getDataset(`${this.selectedPod}`);
    //             let items = this.solidService.getThingAll(solidDataset);

    //             this.logger.info(`Items: ${JSON.stringify(items)}`);

    //             // this.rdf.listFolders(this.selectedPod);
            
    //             // for (let i = 0; i < items.length; i++) {
                    
    //             //     // let item = this.solidService.getStringNoLocale(items[i]);
    //             //     // if (item !== null && Object.keys(item).length !== 0) {
    //             //     //     this.dataItems?.push(JSON.stringify(item));
    //             //     // }
    //             // }
    //         }
    //     } catch (error) {
    //         this.logger.error(error);
    //     }
    // }

    async getDataset() {
        try {
            if (undefined != this.selectedPod) {
                let solidDataset = await this.solidDataService.getDataset(`${this.selectedPod}`);
                this.solidDataService.setContainedResources(solidDataset);
                this.dataset = solidDataset;
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
                
                // solidDataset =  this.solidDataService.solidDataSetAsTurtle(solidDataset);
                this.dataset = solidDataset;
            }
        } catch (error) {
            this.logger.error(error);
        }
    }

    // async getContainedResources() {
    //     try {
    //         if (undefined != this.selectedPod && undefined != this.dataset) {
                
    //             this.containedResources = await this.solidService.getContainedResources(this.dataset);
    //         }
    //     } catch (error) {
    //         this.logger.error(error);
    //     }
    // }

    // async getInbox() {
    //     try {
    //         if (undefined != this.selectedPod) {
    //             // let dataset: any[];
                
    //             let solidDataset: SolidDataset;
        
    //             solidDataset = await this.solidService.getDataset(`${this.selectedPod}inbox/`);
    //             let items = this.solidService.getThingAll(solidDataset);

    //             // this.logger.info(`Inbox: ${JSON.stringify(items)}`);
    //             // for (const item of items) {
    //             //     console.log(`${item.subject.value} ${item.predicate.value} ${item.object.value}`)
    //             // }

    //             this.rdf.listFolders(this.selectedPod);
            
    //             // for (let i = 0; i < items.length; i++) {
                    
    //             //     // let item = this.solidService.getStringNoLocale(items[i]);
    //             //     // if (item !== null && Object.keys(item).length !== 0) {
    //             //     //     this.dataItems?.push(JSON.stringify(item));
    //             //     // }
    //             // }
    //         }
    //     } catch (error) {
    //         this.logger.error(error);
    //     }
    // }

    // async getVcard() {
    //     try {
    //         if (undefined != this.selectedPod) {
    //             // let dataset: any[];
                
    //             let solidDataset: SolidDataset;
        
    //             solidDataset = await this.solidService.getDataset(`${this.selectedPod}profile/card/`);
    //             let items = this.solidService.getThingAll(solidDataset);

    //             this.logger.info(`Vcard: ${JSON.stringify(items)}`);

    //             // this.rdf.listFolders(this.selectedPod);
            
    //             // for (let i = 0; i < items.length; i++) {
                    
    //             //     // let item = this.solidService.getStringNoLocale(items[i]);
    //             //     // if (item !== null && Object.keys(item).length !== 0) {
    //             //     //     this.dataItems?.push(JSON.stringify(item));
    //             //     // }
    //             // }
    //         }
    //     } catch (error) {
    //         this.logger.error(error);
    //     }
    // }
    
    async getPods() {
        this.logger.info('Get Pods');
    }

    updateSandbox (text:string) {
        this.turtleText = document.querySelector("#highlighting-content");
        // let result_element = document.querySelector("#highlighting-content");
        // // Update code
        // result_element.innerText = text;
        // // Syntax Highlight
        // Prism.highlightElement(result_element);
    }

    navigateResource(url: string) {
        this.logger.info(`Navigate url ${url}`);
    }

    thingToString(thing: Thing):string {
        let thingString = '';
        if (undefined != thing) {
            thingString = JSON.stringify(thing);
        }
        thingString
        return thingString;
    }
}
