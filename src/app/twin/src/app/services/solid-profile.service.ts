import { Injectable } from '@angular/core';
import {
    getSolidDataset,
    getThing,
    getStringNoLocale,
    setThing,
    saveSolidDatasetAt,
    createThing,
    addStringNoLocale,
    getPodUrlAll,
    buildThing,
    setStringNoLocale,
    solidDatasetAsTurtle,
} from '@inrupt/solid-client';
import { LocalStorageService, LoggerService, SolidAuthService, SolidDataService } from '@app/services';
import { FOAF, VCARD } from '@inrupt/vocab-common-rdf';
import { getDefaultSession } from '@inrupt/solid-client-authn-browser';

@Injectable({
    providedIn: 'root'
})
export class SolidProfileService {

    // session = getDefaultSession();
    constructor(
            private logger: LoggerService,
            private solidAuthService: SolidAuthService,
            private solidDataService: SolidDataService,
            private localStorageService: LocalStorageService
    ) { }
    
    async readProfile(): Promise<{ name: string; email: string } | null> {
        let name = '';
        let email = '';
        const session = this.solidAuthService.getDefaultSession();
        const webId = this.solidAuthService.getWebId();
        const loggedIn = this.solidAuthService.isLoggedIn();
        this.logger.info(`SDS: Reading profile logged in: ${loggedIn} ${webId}`);
        if ( loggedIn && undefined != session && '' != webId) {
            
            this.logger.info(`SDS: Reading profile logged in`);
            const dataset = await getSolidDataset(webId, { fetch: session.fetch, });
            const profileThing = getThing(dataset, webId);
            this.logger.info(`SDS: Getting profile thing: ${JSON.stringify(profileThing)}`);
            if (undefined != profileThing) {
                name = getStringNoLocale(profileThing, FOAF.name) ?? '';
                email = getStringNoLocale(profileThing, VCARD.hasEmail)?.replace('mailto:', '') ?? '';    
            }
            this.logger.info(`SDS: Name, email: ${name}, ${email}`);
        }
        return { name, email };
    }

    async updateProfile(name: string, email: string): Promise<void> {
        const session = this.solidAuthService.getDefaultSession();
        const webId = this.solidAuthService.getWebId();
        const loggedIn = this.solidAuthService.isLoggedIn();
        const storageRoot = await this.solidDataService.getStorageRoot(session);
        const resourceUrl = `${storageRoot}private/thetwin.ttl`;
        if ( loggedIn && undefined != session && '' != webId) {
            let profileDataset = await getSolidDataset(webId, {
                fetch: session.fetch,
            });
            let profileThing = getThing(profileDataset, webId);
            if (undefined == profileThing) {
                this.logger.info(`SDS: The profile is not there`);
                profileThing = buildThing({ url: webId }).build();
            }

            profileThing = setStringNoLocale(profileThing, FOAF.name, name);
            profileThing = setStringNoLocale(profileThing, VCARD.hasEmail, `mailto:${email}`);
            // const updatedProfileThing = buildThing(profileThing)
            //     .setStringNoLocale(FOAF.name, name)
            //     .setStringNoLocale(VCARD.hasEmail, `mailto:${email}`)
            //     .build();
            
            const updatedDataset = setThing(profileDataset, profileThing);

            const ttlDataset = await solidDatasetAsTurtle(updatedDataset);
            this.logger.info(ttlDataset);
            await saveSolidDatasetAt(resourceUrl, updatedDataset, {
                fetch: session.fetch,
            });
            // const fetchWithHeader = (input: RequestInfo | URL, init: RequestInit = {}) => {
            //     const headers = new Headers(init.headers || {});
            //     headers.set('If-Match', '*'); // Allow overwrite
            //     return session.fetch(input, { ...init, headers });
            // };

            // await saveSolidDatasetAt(resourceUrl, updatedDataset, {
            //     fetch: fetchWithHeader,
            // });
            // await saveSolidDatasetAt(resourceUrl, updatedDataset, {
            //     fetch: session.fetch,
            // });
        }
    }
    // async getProfileData(): Promise<string | null> {
    //     if (!this.session.info.isLoggedIn) return null;
    //     const webId = this.session.info.webId!;
        
    //     try {
    //         const dataset = await getSolidDataset(webId, { fetch: this.session.fetch });
    //         const profileThing = getThing(dataset, webId);
    //         return profileThing ? getStringNoLocale(profileThing, FOAF.name) : null;
    //     } catch (error) {
    //         console.error('Error fetching profile data:', error);
    //         return null;
    //     }
    // }

    // async updateProfileData(newName: string): Promise<boolean> {
    //     if (!this.session.info.isLoggedIn) return false;
    //     const webId = this.session.info.webId!;

    //     try {
    //         let dataset = await getSolidDataset(webId, { fetch: this.session.fetch });
    //         let profileThing = getThing(dataset, webId) || createThing({ name: "profile" });

    //         profileThing = addStringNoLocale(profileThing, FOAF.name, newName);
    //         dataset = setThing(dataset, profileThing);

    //         await saveSolidDatasetAt(webId, dataset, { fetch: this.session.fetch });
    //         return true;
    //     } catch (error) {
    //         console.error('Error updating profile data:', error);
    //         return false;
    //     }
    // }

    // async getPodUrl(): Promise<string | null> {
    //     if (!this.session.info.isLoggedIn) return null;
    //     const webId = this.session.info.webId!;
    //     const podUrls = await getPodUrlAll(webId, { fetch: this.session.fetch });

    //     return podUrls.length > 0 ? podUrls[0] : null; // Return the first Pod URL
    // }
}
