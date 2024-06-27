import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, filter  } from 'rxjs';
import { Router } from '@angular/router';
import { login, logout, fetch, getDefaultSession, handleIncomingRedirect, ISessionInfo } from '@inrupt/solid-client-authn-browser';
import { getSolidDataset, getThing, getThingAll, getStringNoLocale, getUrlAll, getPodUrlAll, SolidDataset, Thing, UrlString, Url, removeThing, saveSolidDatasetAt, getContainedResourceUrlAll, WithServerResourceInfo, isContainer } from "@inrupt/solid-client";
import { SCHEMA_INRUPT, RDF, AS } from "@inrupt/vocab-common-rdf";
import { MatDialog } from '@angular/material/dialog';

import { AlarmService, LoggerService } from '@app/services';
import { IContainedResource } from '@app/interfaces';
import { openIdentityProviderDialog } from '@app/components';


@Injectable({
    providedIn: 'root'
})
export class SolidService {
    private sessionInfoSubject: BehaviorSubject<ISessionInfo | null>;
    public sessionInfo: Observable<ISessionInfo | null>;
    private containedResourcesSubject: BehaviorSubject<IContainedResource[] | null>;
    public containedResources: Observable<IContainedResource[] | null>;
    private thingsSubject: BehaviorSubject<Thing[] | null>;
    public things: Observable<Thing[] | null>;
    public oidcIssuer: string | undefined;
    public clientName: string | undefined;
    private dataset?: SolidDataset & WithServerResourceInfo;
    private selectedPod?: string | Url;
    // containedResources?: string[];

    // fechInit = {
    //     method: 'PATCH',
    //     headers: {
    //         'Content-Type': 'application/sparql-update',
    //     },
    //     body: '',
    // };
    constructor(
        private router: Router,
        private alarmService: AlarmService,
        private logger: LoggerService,
        private dialog: MatDialog,
    ) {
        if (undefined != localStorage.getItem('sessionInfo')) {
            this.removeItem('sessionInfo');
        }
        if (undefined != localStorage.getItem('containedResources')) {
            this.removeItem('containedResources');
        }
        if (undefined != localStorage.getItem('things')) {
            this.removeItem('things');
        }
        this.sessionInfoSubject = new BehaviorSubject(JSON.parse(localStorage.getItem('sessionInfo')!));
        this.sessionInfo = this.sessionInfoSubject.asObservable();
        // this.containedResourcesSubject = new BehaviorSubject(JSON.parse(localStorage.getItem('containedResources')!));
        this.containedResourcesSubject = new BehaviorSubject(JSON.parse(localStorage.getItem('containedResources')!));
        this.containedResources = this.containedResourcesSubject.asObservable();
        this.thingsSubject = new BehaviorSubject(JSON.parse(localStorage.getItem('things')!));
        this.things = this.thingsSubject.asObservable();
        this.oidcIssuer = "https://login.inrupt.com";
        // this.oidcIssuer = "https://stage.graphmetrix.net";
        this.clientName = "thetwin";
    }

    public get sessionInfoValue() {
        return this.sessionInfoSubject.value;
    }

    public get containedResourcesValue() {
        return this.containedResourcesSubject.value;
    }

    public get thingsValue() {
        return this.thingsSubject.value;
    }
    
    /*
    * This will check if current session is active to avoid security problems
    */
    isLoggedIn() {
        let defaultSession = getDefaultSession();
        return defaultSession.info.isLoggedIn;
    }
    
    /*
    *  Make a call to the solid auth endpoint. It requires an identity provider url, which here is coming from the dropdown, which
    *  is populated by the getIdentityProviders() function call. It currently requires a callback url and a storage option or else
    *  the call will fail.
    */
    solidLogin = async () => {
        // Start the Login Process if not already logged in.
        if (!this.isLoggedIn()) {
            // const oidcIssuer = await this.getIdentityProvider();
            await login({
                oidcIssuer: this.oidcIssuer,
                redirectUrl: window.location.href,
                clientName: this.clientName
            });
        }
    }

    getIdentityProvider = async () => {
        openIdentityProviderDialog(this.dialog)
        .pipe(
            filter((val: any) => !!val)
        )
        .subscribe(
            (val: any) => {
                this.logger.debug(`SS: New identity provider: ${JSON.stringify(val)}`);
                // this.updateFlightDetails(val);
            }
        );
    }
    
    /*
    * Handles session after login
    */
    handleSessionAfterLogin = async () => {
        if (!this.isLoggedIn()) {
            let sessionInfo = await handleIncomingRedirect({
                url: window.location.href,
                restorePreviousSession: true
            });

            if(undefined != sessionInfo) {
                this.setItem('sessionInfo', sessionInfo);
                // localStorage.setItem(itemName, JSON.stringify(item));
                this.alarmService.success(`Logged in with WebID [${sessionInfo?.webId}]`, true);
                if (sessionInfo) {
                    this.sessionInfoSubject.next(sessionInfo);
                } else {
                    this.sessionInfoSubject.next(null);
                }
            }
        } else {
            this.logger.info("Already logged in");
        }
    }

    /*
    * Handles session after reload
    */
    handleSessionRestore = async () => {
        await this.handleSessionAfterLogin();
    }
    
    /*
    * Signs out of Solid in this app, by calling the logout function and clearing the localStorage token
    */
    solidLogoutApp = async () => {
        await logout({ logoutType: 'app' })
            .then( () => {
                this.logoutCleanup();
            }).finally( () => {
                this.router.navigate(['account/callback']);
            });
    }

    /*
    * Signs out of Solid in the idp, by calling the logout function and clearing the localStorage token
    */
    solidLogoutIdp = async () => {
        await logout({
                logoutType: 'idp',
                postLogoutUrl: new URL("account/callback", window.location.href).toString(),
                state: "my-state"
            }).then( () => {
                this.logoutCleanup();
            }).finally( () =>{
                this.router.navigate(['account/callback']);
            });
    }

    private logoutCleanup() {
        this.sessionInfoSubject.next(null);
        this.removeItem('sessionInfo');
        this.containedResourcesSubject.next(null);
        this.removeItem('containedResources');
    }

    /*
    * Fetch from Solid Account
    */
    async getAllPods (webId: string): Promise<UrlString[] | any[]> {
        let returnPods = [{}];
        // let pods: UrlString[];
        try {
            // let defaultSession = getDefaultSession();
            // let webId = defaultSession.info.webId;
            if (this.isLoggedIn() && undefined != webId) {
                const pods = await getPodUrlAll(webId, { fetch: fetch });
                returnPods = pods;   
            }
            
        } catch (error) {
            this.logger.error(error);
        }
        return returnPods; 
    }

    

    /*
    * Get Solid dataset
    */
    async getSolidDataset (uri: UrlString | Url): Promise<SolidDataset & WithServerResourceInfo | any> {
        let returnDataset = {};
        try {
            if (this.isLoggedIn() && undefined != uri) {
                this.selectedPod = uri;
                const dataset = await getSolidDataset(uri, { fetch: fetch });
                this.getContainedResources(dataset);
                this.dataset = dataset;
                this.logger.debug(`Dataset: ${JSON.stringify(dataset)}`);
                returnDataset = dataset;
            }
        } catch (error) {
            this.logger.error(error);
        }
        return returnDataset; 
    }

    async solidDataSetAsTurtle (dataset: SolidDataset & WithServerResourceInfo) {
        try {
            if (this.isLoggedIn() && undefined != dataset ) {
                let turtle = await this.solidDataSetAsTurtle(dataset);
                this.setItem('turtle', turtle);
            }
        } catch (error) {
            this.logger.error(error);
        }
    }

    /*
    * Get Solid dataset
    */
    async getDataset (uri: UrlString | Url): Promise<SolidDataset & WithServerResourceInfo> {
        return this.getSolidDataset(uri);
    }
    
    /*
    * Save Solid dataset
    */
    async saveDataset (uri: UrlString | Url, dataset: SolidDataset): Promise<SolidDataset | any> {
        let returnDataset = {};
        try {
            if (this.isLoggedIn() && undefined != uri) {
                const savedDataset = await saveSolidDatasetAt(uri, dataset, { fetch: fetch });
                // this.datasetSubject.next(savedDataset);  
                returnDataset = savedDataset;
            }
        } catch (error) {
            this.logger.error(error);
        }
        return returnDataset; 
    }

    /*
    * Get contained resources from dataset
    */
    getContainedResources (dataset: SolidDataset & WithServerResourceInfo){
        try {
            if (this.isLoggedIn() && undefined != dataset && this.selectedPod) {
                let baseLength = this.selectedPod.toString().length;
                let containedResources = getContainedResourceUrlAll(dataset)
                .sort(this.compareResourceUrls)
                .map((resourceUrl) => {
                    let name = resourceUrl.substring(baseLength);
                    return {"url": resourceUrl, "name": name}
                });
                this.logger.info(`Contained resources: ${JSON.stringify(containedResources)}`);
                this.containedResourcesSubject.next(containedResources);
            }
        } catch (error) {
            this.logger.error(error);
        }
    }

    /*
    * Get thing all from dataset
    */
    getThingAll (dataset: SolidDataset & WithServerResourceInfo): Thing[] | any {
        let returnThingAll = {};
        try {
            if (this.isLoggedIn() && undefined != dataset) {
                let things = getThingAll(dataset);
                this.thingsSubject.next(things);
                returnThingAll = things; 
            }
        } catch (error) {
            this.logger.error(error);
        }
        return returnThingAll; 
    }

    /*
    * Add thing to dataset
    */
    addThing (dataset: SolidDataset, thing: UrlString | Url | Thing): SolidDataset | any {
        let returnDataset = {};
        try {
            // let defaultSession = getDefaultSession();
            // let webId = defaultSession.info.webId;
            if (this.isLoggedIn() && undefined != dataset) {
                returnDataset = removeThing(dataset, thing);    
            }
            
        } catch (error) {
            this.logger.error(error);
        }
        return returnDataset; 
    }

    /*
    * Remove thing from dataset
    */
    removeThing (dataset: SolidDataset, thing: UrlString | Url | Thing): SolidDataset | any {
        let returnDataset = {};
        try {
            // let defaultSession = getDefaultSession();
            // let webId = defaultSession.info.webId;
            if (this.isLoggedIn() && undefined != dataset) {
                returnDataset = removeThing(dataset, thing);    
            }
            
        } catch (error) {
            this.logger.error(error);
        }
        return returnDataset; 
    }

    /*
    * Remove thing from dataset
    */
    getStringNoLocale (thing: Thing) {
        let returnItem = {};
        try {
            // let defaultSession = getDefaultSession();
            // let webId = defaultSession.info.webId;
            if (this.isLoggedIn() && undefined != thing) {
                let item = getStringNoLocale(thing, SCHEMA_INRUPT.name);
                if (item !== null) {
                    returnItem = item;
                }   
            }
        } catch (error) {
            this.logger.error(error);
        }
        return returnItem; 
    }
    

    /*
    *  Set item in local storage
    */
    setItem(itemName:string, item:any) {
        localStorage.setItem(itemName, JSON.stringify(item));
    }

    /*
    *  Remove item from local storage
    */
    removeItem(itemName:string) {
        localStorage.removeItem(itemName);
    }

    compareResourceUrls(a: UrlString, b: UrlString): number {
        if (isContainer(a) && !isContainer(b)) {
          return -1;
        }
        if (!isContainer(a) && isContainer(b)) {
          return 1;
        }
      
        return a.localeCompare(b);
      }
}
