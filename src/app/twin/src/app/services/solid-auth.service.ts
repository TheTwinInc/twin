import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, filter  } from 'rxjs';
import { Router } from '@angular/router';
import { login, logout, fetch, getDefaultSession, handleIncomingRedirect, ISessionInfo, Session } from '@inrupt/solid-client-authn-browser';
import { SolidDataset, getSolidDataset, saveSolidDatasetAt, Thing, getThing, getThingAll, removeThing, getStringNoLocale, getUrlAll, getPodUrlAll, UrlString, Url, getContainedResourceUrlAll, WithServerResourceInfo, isContainer, setStringNoLocale, setThing, createThing } from "@inrupt/solid-client";
import { SCHEMA_INRUPT, RDF, AS, VCARD } from "@inrupt/vocab-common-rdf";
import { MatDialog } from '@angular/material/dialog';

import { AlarmService, LocalStorageService, LoggerService, SolidDataService } from '@app/services';
import { IContainedResource } from '@app/interfaces';
import { openIdentityProviderDialog } from '@app/components';


@Injectable({
    providedIn: 'root'
})
export class SolidAuthService {
    private sessionInfoSubject: BehaviorSubject<ISessionInfo | null>;
    public sessionInfo: Observable<ISessionInfo | null>;
    // private containedResourcesSubject: BehaviorSubject<IContainedResource[] | null>;
    // public containedResources: Observable<IContainedResource[] | null>;
    // private thingsSubject: BehaviorSubject<Thing[] | null>;
    // public things: Observable<Thing[] | null>;
    public oidcIssuer: string | undefined;
    public clientName: string | undefined;

    private session = getDefaultSession();
    
    constructor(
        private router: Router,
        private alarmService: AlarmService,
        private logger: LoggerService,
        private dialog: MatDialog,
        // private localStorageService: LocalStorageService,
        // private solidDataService: SolidDataService
    ) {
        // TEST
        // this.initSession();

        if (undefined != localStorage.getItem('sessionInfo')) {
            // this.localStorageService.removeItem('sessionInfo');
        }
        // if (undefined != localStorage.getItem('containedResources')) {
        //     this.localStorageService.removeItem('containedResources');
        // }
        // if (undefined != localStorage.getItem('things')) {
        //     this.localStorageService.removeItem('things');
        // }
        
        this.sessionInfoSubject = new BehaviorSubject(JSON.parse(localStorage.getItem('sessionInfo')!));
        this.sessionInfo = this.sessionInfoSubject.asObservable();

        // this.containedResourcesSubject = new BehaviorSubject(JSON.parse(localStorage.getItem('containedResources')!));
        // this.containedResources = this.containedResourcesSubject.asObservable();

        // this.thingsSubject = new BehaviorSubject(JSON.parse(localStorage.getItem('things')!));
        // this.things = this.thingsSubject.asObservable();
        // this.oidcIssuer = "https://login.inrupt.com";
        // this.oidcIssuer = "https://trinpod.eu";
        // this.oidcIssuer = "https://trinpod.eu/gmxLogin";
        this.oidcIssuer = "https://stage.graphmetrix.net";
        this.clientName = "thetwin";
    }

    public get sessionInfoValue() {
        return this.sessionInfoSubject.value;
    }

    /*
    * This will check if current session is active to avoid security problems
    */
    public isLoggedIn(): boolean {
        let isLoggedIn = false;
        let defaultSession = getDefaultSession();
        if (undefined != defaultSession.info) {
            isLoggedIn = defaultSession.info.isLoggedIn;
        }
        // this.logger.debug(`HC: Is logged in: ${isLoggedIn}`);
        return isLoggedIn;
        // return this.session.info.isLoggedIn;
    }

    getWebId(): string {
        let webId = '';
        let defaultSession = getDefaultSession();
        if (undefined != defaultSession.info.webId) {
            webId = defaultSession.info.webId;
        }
        // this.logger.debug(`HC: Web id: ${webId}`);
        return webId;
    }

    /*
    *  Make a call to the solid auth endpoint. It requires an identity provider url, which here is coming from the dropdown, which
    *  is populated by the getIdentityProviders() function call. It currently requires a callback url and a storage option or else
    *  the call will fail.
    */
    solidLogin = async (oidcIssuer: string) => {
        // Start the Login Process if not already logged in.
        if (!this.isLoggedIn()) {
            if (undefined != this.oidcIssuer && '' != this.oidcIssuer) {
                let redirectUrl = this.getPathFromUrl(window.location.href);
                // this.logger.info(`SAS: ${redirectUrl}`);
                await login({
                    // oidcIssuer: oidcIssuer,
                    oidcIssuer: this.oidcIssuer,
                    // redirectUrl: window.location.href,
                    redirectUrl: redirectUrl,
                    clientName: this.clientName
                });
            }
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
                this.oidcIssuer = val.oidcIssuer;
            }
        );
        // return this.oidcIssuer;
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
                // this.localStorageService.setItem('sessionInfo', sessionInfo);
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
    logoutApp = async () => {
        this.logger.debug(`AUTH: Logout`);
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
                // postLogoutUrl: new URL("account/callback", window.location.href).toString(),
                state: "my-state"
            }).then( () => {
                this.logoutCleanup();
            }).finally( () =>{
                this.router.navigate(['account/callback']);
            });
    }

    private logoutCleanup() {
        this.sessionInfoSubject.next(null);
        // this.localStorageService.removeItem('sessionInfo');
    }

    getPathFromUrl(url: string) {
        return url.split(/[?#]/)[0];
    }

    getDefaultSession(): Session {
        return getDefaultSession();
    }
}
