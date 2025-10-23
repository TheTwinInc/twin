import { Injectable, OnDestroy, OnInit } from '@angular/core';
import { IContainedResource } from '@app/interfaces';
import { LocalStorageService, LoggerService, RdfService, SolidAuthService } from '@app/services';
import { buildThing, createSolidDataset, getContainedResourceUrlAll, getPodUrlAll, getSolidDataset, getStringNoLocale, getThingAll, isContainer, removeThing, saveSolidDatasetAt, setStringNoLocale, SolidDataset, Thing, Url, UrlString, WithServerResourceInfo, getThing, setThing, createThing, getUrl } from '@inrupt/solid-client';
import { fetch, ISessionInfo, Session } from '@inrupt/solid-client-authn-browser';
// import { CreateThingOptions } from '@inrupt/solid-client/dist/thing/thing';
import { FOAF, SCHEMA_INRUPT, VCARD } from '@inrupt/vocab-common-rdf';
import { BehaviorSubject, Observable, Subject, takeUntil } from 'rxjs';
import { DirectedGraph } from 'graphology';

@Injectable({
    providedIn: 'root'
})
// export class SolidDataService implements OnInit, OnDestroy{
export class SolidDataService {
    // private readonly ngUnsubscribe: Subject<any> = new Subject<any>();
    private containedResourcesSubject: BehaviorSubject<IContainedResource[] | null>;
    public containedResources: Observable<IContainedResource[] | null>;
    private thingsSubject: BehaviorSubject<Thing[] | null>;
    public things: Observable<Thing[] | null>;
    private turtleSubject: BehaviorSubject<Thing[] | null>;
    public turtle: Observable<Thing[] | null>;

    // private _bags: IBag[] = [];
    // bags = new BehaviorSubject<IBag[]>(this._bags)
    private _assets = new DirectedGraph();
    public assets = new BehaviorSubject<DirectedGraph>(this._assets)

    private assetsGraphSubject: BehaviorSubject<DirectedGraph>;
    public assetsGraph: Observable<DirectedGraph>;
    // private sessionInfo?: ISessionInfo | null;
    private selectedPod?: string | Url;
    private dataset?: SolidDataset & WithServerResourceInfo;

    constructor(
        private logger: LoggerService,
        private solidAuthService: SolidAuthService,
        private localStorageService: LocalStorageService,
        private rdfService: RdfService
    ) {
        if (undefined != localStorage.getItem('containedResources')) {
            this.localStorageService.removeItem('containedResources');
        }
        if (undefined != localStorage.getItem('things')) {
            this.localStorageService.removeItem('things');
        }
        if (undefined != localStorage.getItem('turtle')) {
            this.localStorageService.removeItem('turtle');
        }

        this.containedResourcesSubject = new BehaviorSubject(JSON.parse(localStorage.getItem('containedResources')!));
        this.containedResources = this.containedResourcesSubject.asObservable();
        
        this.thingsSubject = new BehaviorSubject(JSON.parse(localStorage.getItem('things')!));
        this.things = this.thingsSubject.asObservable();
        
        this.turtleSubject = new BehaviorSubject(JSON.parse(localStorage.getItem('turtle')!));
        this.turtle = this.thingsSubject.asObservable();

        this.assetsGraphSubject = new BehaviorSubject(JSON.parse(localStorage.getItem('assetsGraph')!));
        this.assetsGraph = this.assetsGraphSubject.asObservable();

        this.initAssetsGraph();
    }

    public get assetsGraphValue() {
        return this.assetsGraphSubject.value;
    }

    initAssetsGraph() {
        const assetsGraph = new DirectedGraph();
        this.assetsGraphSubject.next(assetsGraph);
    }

    // ngOnInit() {
    //     this.solidAuthService.sessionInfo
    //         .pipe(takeUntil(this.ngUnsubscribe))
    //         .subscribe(x => {
    //             this.sessionInfo = x;
    //             // this.onSessionChange(this.sessionInfo);
    //         });
    // }

    // ngOnDestroy(): void {
    //     this.ngUnsubscribe.next(null);
    //     this.ngUnsubscribe.unsubscribe();
    // }

    // async onSessionChange (sessionInfo: any) {
    //     if (sessionInfo?.isLoggedIn) {
    //         try {
    //             this.pods = await this.solidDataService.getAllPods(sessionInfo.webId);
    //             // this.logger.info(`PODS: ${JSON.stringify(this.pods)}`);
    //         } catch (error) {
    //             this.logger.error(error);
    //         }
    //     }
    // }

    /*
    * Fetch from Solid Account
    */
    async getAllPods (webId: string): Promise<UrlString[] | any[]> {
        let returnPods = [{}];
        try {
            if (this.solidAuthService.isLoggedIn() && undefined != webId) {
                // this.rdfService.listAllTriples(webId);
                const pods = await this.rdfService.findMembershipContainers(webId);
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
            if (this.solidAuthService.isLoggedIn() && undefined != uri) {
                this.selectedPod = uri;
                const dataset = await getSolidDataset(uri, { fetch: fetch });
                this.dataset = dataset;
                // this.logger.debug(`Dataset: ${JSON.stringify(dataset)}`);
                returnDataset = dataset;
            }
        } catch (error) {
            this.logger.error(error);
            const dataset = createSolidDataset();
            returnDataset = dataset;
        }
        return returnDataset; 
    }

    /*
    * Get Solid dataset as turtle
    */
    async solidDataSetAsTurtle (dataset: SolidDataset & WithServerResourceInfo) {
        try {
            if (this.solidAuthService.isLoggedIn() && undefined != dataset ) {
                let turtle = await this.solidDataSetAsTurtle(dataset);
                // this.localStorageService.setItem('turtle', turtle);
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
            if (this.solidAuthService.isLoggedIn() && undefined != uri) {
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
    * Set contained resources from dataset
    */
    setContainedResources (dataset: SolidDataset & WithServerResourceInfo){
        try {
            let containedResources = this.getContainedResources(dataset);
            // this.logger.info(`Contained resources: ${JSON.stringify(containedResources)}`);
            this.containedResourcesSubject.next(containedResources);
            // this.setAssetsGraph(containedResources);
        } catch (error) {
            this.logger.error(error);
        }
    }
    
    getContainedResources(dataset: SolidDataset & WithServerResourceInfo): IContainedResource[] {
        let containedResources: IContainedResource[] = [];
        if (this.solidAuthService.isLoggedIn() && undefined != dataset && this.selectedPod) {
            let baseLength = this.selectedPod.toString().length;
            containedResources = getContainedResourceUrlAll(dataset)
                .sort(this.compareResourceUrls)
                .map((resourceUrl) => {
                    let name = resourceUrl.substring(baseLength);
                    return { "url": resourceUrl, "name": name };
                });
        }
        return containedResources;
    }

    // setAssetsGraph(dataset: SolidDataset & WithServerResourceInfo) {
    // setAssetsGraph(selectedResource: IContainedResource, containedResources: IContainedResource[]) {
    setAssetsGraph(selectedResource: IContainedResource, containedResources: IContainedResource[]) {
        try {
        
            let assetsGraph = this.assetsGraphValue;
            if (!assetsGraph.hasNode(selectedResource.url)) {
                assetsGraph.addNode(selectedResource.url, {name: selectedResource.name, url: selectedResource.url});
                // assetsGraph.addNode(selectedResource.url, {label: selectedResource.name, route: selectedResource.url, children: []});
            }

            for (let index = 0; index < containedResources.length; index++) {
                const element = containedResources[index];
                if (!assetsGraph.hasNode(element.url)) {
                    assetsGraph.addNode(element.url, {name: element.name, url: element.url});
                    // assetsGraph.addNode(element.url, {label: element.name, route: element.url, children: []});
                    if (undefined != selectedResource) {
                        assetsGraph.addEdge(selectedResource.url, element.url);
                    }    
                }
            }

            this.logger.info(`SDS: Serialized graph: ${JSON.stringify(assetsGraph.export())}`);
            this.assetsGraphSubject.next(assetsGraph);
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
            if (this.solidAuthService.isLoggedIn() && undefined != dataset) {
                let things = getThingAll(dataset);
                this.thingsSubject.next(things);
                returnThingAll = things;
                // this.logger.info(`Things: ${JSON.stringify(things)}`);
            }
        } catch (error) {
            this.logger.error(error);
        }
        return returnThingAll; 
    }

    /*
    * Create thing dataset
    */
    // createThing (options?: CreateThingOptions): SolidDataset | any {
    //     let returnThing = {};
    //     try {
    //         // let defaultSession = getDefaultSession();
    //         // let webId = defaultSession.info.webId;
    //         if (this.solidAuthService.isLoggedIn()) {
    //             returnThing = createThing(options);    
    //         }
            
    //     } catch (error) {
    //         this.logger.error(error);
    //     }
    //     return returnThing; 
    // }

    /*
    * Add thing to dataset
    */
    addThing (dataset: SolidDataset, thing: UrlString | Url | Thing): SolidDataset | any {
        let returnDataset = {};
        try {
            // let defaultSession = getDefaultSession();
            // let webId = defaultSession.info.webId;
            if (this.solidAuthService.isLoggedIn() && undefined != dataset) {
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
            if (this.solidAuthService.isLoggedIn() && undefined != dataset) {
                returnDataset = removeThing(dataset, thing);    
            }
            
        } catch (error) {
            this.logger.error(error);
        }
        return returnDataset; 
    }

    getStringNoLocale (thing: Thing) {
        let returnItem = {};
        try {
            // let defaultSession = getDefaultSession();
            // let webId = defaultSession.info.webId;
            if (this.solidAuthService.isLoggedIn() && undefined != thing) {
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
    
    compareResourceUrls(a: UrlString, b: UrlString): number {
        if (isContainer(a) && !isContainer(b)) {
          return -1;
        }
        if (!isContainer(a) && isContainer(b)) {
          return 1;
        }
        return a.localeCompare(b);
    }

    logoutCleanup () {
        let emptyContainedResources: IContainedResource[] = [];
        this.containedResourcesSubject.next(emptyContainedResources);
        this.localStorageService.removeItem('containedResources');
    }

    // async saveProfile(name: string, email: string) {
    //     if (this.solidAuthService.isLoggedIn()) {
    //         // const profileDatasetUrl = this.session.info.webId;
    //         const profileDatasetUrl = this.solidAuthService.getWebId();

    //         let session = this.solidAuthService.sessionInfoValue;
    //         if (undefined != session) {
    //             let profileDataset = await getSolidDataset(profileDatasetUrl, {
    //                 fetch: session.fetch,
    //             });

    //             let profile = getThing(profileDataset, profileDatasetUrl) || createThing({ url: profileDatasetUrl });

    //             profile = setStringNoLocale(profile, VCARD.fn, name);
    //             profile = setStringNoLocale(profile, VCARD.email, email);

    //             profileDataset = setThing(profileDataset, profile);

    //             await saveSolidDatasetAt(profileDatasetUrl, profileDataset, {
    //             fetch: this.session.fetch,
    //             });
    //         }
           
    //     }
    // }

    // async loadProfileData(): Promise<{ name: string; email: string } | null> {
    //     if (!this.session.info.webId) throw new Error('Not logged in');

    //     const podUrl = this.session.info.webId.replace(/profile\/card#me$/, '');
    //     const storageUrl = `${podUrl}private/onboarding.ttl`;

    //     try {
    //         let name = '';
    //         let email = '';
    //         const dataset = await getSolidDataset(storageUrl, {
    //             fetch: this.session.fetch,
    //         });

    //         // const things = getThingAll(dataset);
    //         const things = this.solidDataService.getThingAll(dataset);
    //         if (things.length > 0){
    //             const thing = things[0]; // assuming only one onboarding Thing
    //             name = getStringNoLocale(thing, VCARD.fn) ?? '';
    //             email = getStringNoLocale(thing, VCARD.email) ?? '';
    //         }
    //         return { name, email };
    //     } catch (err) {
    //         console.error('Error loading onboarding data:', err);
    //         return null;
    //     }
    // }
    // async readProfile(): Promise<{ name: string; email: string } | null> {
    //     let name = '';
    //     let email = '';
    //     const session = this.solidAuthService.getDefaultSession();
    //     const webId = this.solidAuthService.getWebId();
    //     const loggedIn = this.solidAuthService.isLoggedIn();
    //     this.logger.info(`SDS: Reading profile logged in: ${loggedIn} ${webId}`);
    //     if ( loggedIn && undefined != session && '' != webId) {
            
    //         this.logger.info(`SDS: Reading profile logged in`);
    //         const profileDataset = await getSolidDataset(webId, { fetch: session.fetch, });
    //         const profileThing = getThing(profileDataset, webId);
    //         this.logger.info(`SDS: Getting profile thing: ${JSON.stringify(profileThing)}`);
    //         if (undefined != profileThing) {
    //             name = getStringNoLocale(profileThing, FOAF.name) ?? '';
    //             email = getStringNoLocale(profileThing, VCARD.hasEmail)?.replace('mailto:', '') ?? '';    
    //         }
    //         this.logger.info(`SDS: Name, email: ${name}, ${email}`);
    //     }
    //     return { name, email };
    // }

    // async updateProfile(name: string, email: string): Promise<void> {
    //     const session = this.solidAuthService.getDefaultSession();
    //     const webId = this.solidAuthService.getWebId();
    //     const loggedIn = this.solidAuthService.isLoggedIn();
    //     if ( loggedIn && undefined != session && '' != webId) {
    //         let profileDataset = await getSolidDataset(webId, {
    //             fetch: session.fetch,
    //         });

    //         let profileThing = getThing(profileDataset, webId);
    //         if (undefined == profileThing) {
    //             this.logger.info(`SDS: The profile is not there`);
    //             profileThing = buildThing({ url: webId }).build();
    //         }

    //         const updatedThing = buildThing(profileThing)
    //             .setStringNoLocale(FOAF.name, name)
    //             .setStringNoLocale(VCARD.hasEmail, `mailto:${email}`)
    //             .build();

    //         const updatedDataset = setThing(profileDataset, updatedThing);

    //         await saveSolidDatasetAt(webId, updatedDataset, {
    //             fetch: session.fetch,
    //         });
    //     }
    // }

    async getStorageRoot(session: Session): Promise<string> {
        const webId = session.info.webId!;
        let storage: string | null = '';
        const profileDataset = await getSolidDataset(webId, { fetch: session.fetch });
        const profileThing = getThing(profileDataset, webId);
        if (!profileThing) throw new Error('Profile not found');

        const storageUrl = getUrl(profileThing, 'http://www.w3.org/ns/pim/space#storage');
        if (storageUrl) {
            storage = storageUrl;
        };
        return storage;
    }

    
}
