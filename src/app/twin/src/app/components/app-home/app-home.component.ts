import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ISessionInfo } from '@inrupt/solid-client-authn-browser';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { AlarmService, SolidService, LoggerService } from '@app/services';
import { SolidDataset } from '@inrupt/solid-client';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [NgIf, NgFor, MatCardModule, MatIconModule],
    templateUrl: './app-home.component.html',
    styleUrl: './app-home.component.css'
})
export class AppHomeComponent implements OnInit, OnDestroy {
    private readonly ngUnsubscribe: Subject<any> = new Subject<any>();
    sessionInfo?: ISessionInfo | null;
    dataItems?: any[];

    constructor(
        private solidService: SolidService,
        private alarmService: AlarmService,
        private logger: LoggerService,
    ) { }
    
    ngOnInit() {
        this.solidService.sessionInfo
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(x => {
                this.sessionInfo = x;
                // this.onSessionChange(this.sessionInfo);
            });
        this.solidService.handleSessionRestore();
        this.dataItems = [];
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next(null);
        this.ngUnsubscribe.unsubscribe();
    }

    // async onSessionChange (sessionInfo: any) {
    //     if (sessionInfo?.isLoggedIn) {
    //         const pods = await this.solidService.getAllPods(sessionInfo.webId);
    //         this.logger.info(`PODS: ${JSON.stringify(pods)}`);

    //         // this.dataSetContent = JSON.stringify(pods);

    //         // if (undefined != pods[0] ) {
    //         let readingListUrl = '';
    //         if (undefined != pods && pods.length >= 0 ) {
    //             readingListUrl = `${pods[0]}getting-started/readingList/myList`;
    //         }
            
    //         let myReadingList: SolidDataset;

    //         try {
    //             // Attempt to retrieve the reading list in case it already exists.
    //             myReadingList = await this.solidService.getDataset(readingListUrl);
    //             // Clear the list to override the whole list
    //             let items = this.solidService.getThingAll(myReadingList);
    //             // this.dataSetContent += JSON.stringify(items);
    //             // items.forEach((item) => {
    //             //     myReadingList = removeThing(myReadingList, item);
    //             // });
    //             let listcontent = "";
    //             for (let i = 0; i < items.length; i++) {
    //                 let item = this.solidService.getStringNoLocale(items[i]);
    //                 if (item !== null && Object.keys(item).length !== 0) {
    //                     // listcontent += JSON.stringify(item) + "\n";
    //                     this.dataItems?.push(JSON.stringify(item));
    //                 }
    //             }
    //             // this.dataItems += JSON.stringify(listcontent);
    //         } catch (error) {
    //             // if (typeof error?.statusCode === "number" && error.statusCode === 404) {
    //             //     // if not found, create a new SolidDataset (i.e., the reading list)
    //             //     myReadingList = createSolidDataset();
    //             // } else {
    //                 console.error(error);
    //         }
    //         // pods?.forEach(pod => {
    //         //     let podOption = {};
    //         //     podOption.textContent = pod.toString();
    //         //     podOption.value = pod.toString();
                
    //         // });
    //         // let response = await this.solidService.getDataSet("https://thetwin.stage.graphmetrix.net/");
    //         // this.dataSetContent = JSON.stringify(response);
    //         // this.logger.info(`DATASET: ${JSON.stringify(dataSet)}`);
    //     }
    // }
}
    

    
