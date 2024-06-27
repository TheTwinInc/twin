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

import { AlarmService, SolidService, LoggerService, RdfService, HighlightService } from '@app/services';
import { SolidDataset, UrlString, WithServerResourceInfo } from '@inrupt/solid-client';
import { IContainedResource } from '@app/interfaces';



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
        MatListModule
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

    constructor(
        private solidService: SolidService,
        private alarmService: AlarmService,
        private logger: LoggerService,
        private rdf: RdfService,
        private fb: UntypedFormBuilder,
        private highlightService: HighlightService
    ) { }

    ngOnInit() {
        this.solidService.sessionInfo
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(x => {
                this.sessionInfo = x;
                this.onSessionChange(this.sessionInfo);
            });
        this.solidService.containedResources
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(x => {
                this.containedResources = x;
                this.onSessionChange(this.containedResources);
            });
        this.solidService.handleSessionRestore();
        this.dataItems = [];
        this.sandboxForm = this.fb.group({
            text: [null, null],
        });
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
                this.pods = await this.solidService.getAllPods(sessionInfo.webId);
                this.pods.push('https://thetwin-app.stage.graphmetrix.net/i');
                this.pods.push('https://thetwin-iot.stage.graphmetrix.net/i');
                this.logger.info(`PODS: ${JSON.stringify(this.pods)}`);
            } catch (error) {
                this.logger.error(error);
            }
            

            // // this.dataSetContent = JSON.stringify(pods);

            // // if (undefined != pods[0] ) {
            // let readingListUrl = '';
            // if (undefined != this.pods && this.pods.length >= 0 ) {
            //     readingListUrl = `${this.pods[0]}getting-started/readingList/myList`;
            // }
            
            // let myReadingList: SolidDataset;

            // try {
            //     // Attempt to retrieve the reading list in case it already exists.
            //     myReadingList = await this.solidService.getDataset(readingListUrl);
            //     // Clear the list to override the whole list
            //     let items = this.solidService.getThingAll(myReadingList);
            //     // this.dataSetContent += JSON.stringify(items);
            //     // items.forEach((item) => {
            //     //     myReadingList = removeThing(myReadingList, item);
            //     // });
            //     for (let i = 0; i < items.length; i++) {
            //         let item = this.solidService.getStringNoLocale(items[i]);
            //         if (item !== null && Object.keys(item).length !== 0) {
            //             // listcontent += JSON.stringify(item) + "\n";
            //             this.dataItems?.push(JSON.stringify(item));
            //         }
            //     }
            //     // this.dataItems += JSON.stringify(listcontent);
            // } catch (error) {
            //     // if (typeof error?.statusCode === "number" && error.statusCode === 404) {
            //     //     // if not found, create a new SolidDataset (i.e., the reading list)
            //     //     myReadingList = createSolidDataset();
            //     // } else {
            //         console.error(error);
            // }
            // pods?.forEach(pod => {
            //     let podOption = {};
            //     podOption.textContent = pod.toString();
            //     podOption.value = pod.toString();
                
            // });
            // let response = await this.solidService.getDataSet("https://thetwin.stage.graphmetrix.net/");
            // this.dataSetContent = JSON.stringify(response);
            // this.logger.info(`DATASET: ${JSON.stringify(dataSet)}`);
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
                let solidDataset;
                solidDataset = await this.solidService.getDataset(`${this.selectedPod}`);
                this.dataset = solidDataset;
            }
        } catch (error) {
            this.logger.error(error);
        }
    }

    async getDatasetAsTurtle() {
        try {
            if (undefined != this.selectedPod) {
                let solidDataset;
                solidDataset = await this.solidService.getDataset(`${this.selectedPod}`);
                this.solidService.solidDataSetAsTurtle(solidDataset);
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
}
