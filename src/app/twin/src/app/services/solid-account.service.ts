import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, scheduled  } from 'rxjs';
import { Router } from '@angular/router';
import { SolidSession } from  '@app/interfaces';
import { login, logout, getDefaultSession, handleIncomingRedirect, Session } from '@inrupt/solid-client-authn-browser';
import { User } from '@app/models';

import { AlarmService } from './alarm.service';

declare let solid: any;

@Injectable({
    providedIn: 'root'
})
export class SolidAccountService {
    // session?: Observable<SolidSession | any>;
    // private userSubject: BehaviorSubject<User | null>;
    // public user: Observable<User | null>;
    private sessionSubject: BehaviorSubject<Session | null>;
    public session: Observable<Session | null>;

    fechInit = {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/sparql-update',
        },
        body: '',
    };
    constructor(
        private router: Router,
        private alarmService: AlarmService
    ) {
        // this.userSubject = new BehaviorSubject(JSON.parse(localStorage.getItem('user')!));
        // this.user = this.userSubject.asObservable();
        this.sessionSubject = new BehaviorSubject(JSON.parse(localStorage.getItem('session')!));
        this.session = this.sessionSubject.asObservable();
    }

    public get sessionValue() {
        return this.sessionSubject.value;
    }
    // public get userValue() {
    //     return this.userSubject.value;
    // }
    /*
    * This will check if current session is active to avoid security problems
    */
    // isSessionActive = async () => {
    //     this.session = from(solid.auth.currentSession());
    // }

    /**
   * Alternative login-popup function. This will open a popup that will allow you to choose an identity provider
   * without leaving the current page
   * This is recommended if you don't want to leave the current workflow.
   */
    // solidLoginPopup = async () => {
    //     try {
    //         await solid.auth.popupLogin({ popupUri: './login-popup'});
    //         // Check if session is valid to avoid redirect issues
    //         await this.isSessionActive();

    //         // popupLogin success redirect to profile
    //         this.router.navigate(['/users']);
    //     } catch (error) {
    //         console.log(`Error: ${error}`);
    //     }
    // }

    /*
    * Signs out of Solid in this app, by calling the logout function and clearing the localStorage token
    */
    solidSignOut = async () => {
        try {
            await logout();
            // Remove localStorage
            // localStorage.removeItem('solid-auth-client');
            // Redirect to login page
            this.router.navigate(['/']);
        } catch (error) {
            console.log(`Error: ${error}`);
        }
    }

    saveOldUserData = (profile: any) => {
        if (!localStorage.getItem('oldProfileData')) {
            localStorage.setItem('oldProfileData', JSON.stringify(profile));
        }
    }

    getOldUserData = () => {
        let oldProfileData = localStorage.getItem('oldProfileData');
        let profileData = '';
        if (undefined != oldProfileData && null != oldProfileData ) {
            profileData = oldProfileData;
        } 
        return JSON.parse(profileData);
    }

    /*
    *  Make a call to the solid auth endpoint. It requires an identity provider url, which here is coming from the dropdown, which
    *  is populated by the getIdentityProviders() function call. It currently requires a callback url and a storage option or else
    *  the call will fail.
    */
    solidLogin = async () => {
        // Start the Login Process if not already logged in.
        console.log(`Solid login ${this.router.url}`);
        console.log(`Solid login uri ${window.location.href}`);
        if (!getDefaultSession().info.isLoggedIn) {
            await login({
                oidcIssuer: "https://login.inrupt.com",
                // oidcIssuer: "https://thetwin.stage.graphmetrix.net",
                // oidcIssuer: "https://id.inrupt.com/thetwin",
                // redirectUrl: window.location.href,
                redirectUrl: new URL("", window.location.href).toString(),
                // redirectUrl: window.location.href,
                clientName: "thetwin"
            });
        }
    }
    
    handleRedirectAfterLogin = async () => {
        let defaultSession = getDefaultSession();
        console.log(`Before handleRedirectAfterLogin: ${defaultSession.info.isLoggedIn}`);
        if (!getDefaultSession().info.isLoggedIn) {
            // await handleIncomingRedirect({
            //     url: window.location.href,
            //     restorePreviousSession: true
            // });
            await handleIncomingRedirect({
                url: window.location.href,
                restorePreviousSession: true
            }).then(sessionInfo => {
                localStorage.setItem('sessionInfo', JSON.stringify(sessionInfo));
                console.log(`Logged in with WebID [${sessionInfo?.webId}]`);
                this.alarmService.success(`Logged in with WebID [${sessionInfo?.webId}]`, true);
            }).finally(() => {
                console.log("Redirect finished..");
            });
            defaultSession = getDefaultSession();
            localStorage.setItem('session', JSON.stringify(defaultSession));
            console.log(`After handleRedirectAfterLogin: ${defaultSession.info.isLoggedIn}`);
            this.router.navigate(['http://localhost:4200/users']);
        } else {
            console.log("Already logged in");
        }
    }
    
    solidLogoutApp = async () => {
        let defaultSession = getDefaultSession();
        if (defaultSession.info.isLoggedIn) {
            await defaultSession.logout({ logoutType: 'app' });
            defaultSession = getDefaultSession();
            console.log(`After solidLogoutApp: ${defaultSession.info.isLoggedIn}`);
            localStorage.removeItem('sessionInfo');
            this.sessionSubject.next(null);
            this.router.navigate(['/account/logout']);
        }   
    }

    solidLogoutIdp = async () => {
        let defaultSession = getDefaultSession();
        if (defaultSession.info.isLoggedIn) {
            await defaultSession.logout({
                logoutType: 'idp',
                postLogoutUrl: new URL("account/logout", window.location.href).toString(),
                state: "my-state"
            });
            defaultSession = getDefaultSession();
            console.log(`After solidLogoutIdp: ${defaultSession.info.isLoggedIn}`);
        }   
    }
}
