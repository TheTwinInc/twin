import { Injectable } from '@angular/core';
import { LocalStorageService, LoggerService, RdfService, SolidAuthService, SolidDataService } from '@app/services';
import { FOAF, VCARD } from '@inrupt/vocab-common-rdf';
import { IProfile as IProfile, IValueUpdate } from '@app/interfaces';
import { ns } from '@app/utils';

// const SOLID = $rdf.Namespace('http://www.w3.org/ns/solid/terms#');

@Injectable({
    providedIn: 'root'
})
export class SolidProfileService {

    // private ns;

    // session = getDefaultSession();
    constructor(
            private logger: LoggerService,
            private solidAuthService: SolidAuthService,
            private solidDataService: SolidDataService,
            private rdfService: RdfService,
            private localStorageService: LocalStorageService
    ) { }
    
    getProfileUrl(webId: string): string | null {
        let profileUrl;
        profileUrl = this.rdfService.getProfileUrl(webId);
        return profileUrl;
    }

    async getProfile(): Promise<IProfile | null> {
        const session = this.solidAuthService.getDefaultSession();
        const webId = this.solidAuthService.getWebId();
        const loggedIn = this.solidAuthService.isLoggedIn();
        let profile: IProfile = {
            webId: webId,
            name: '',
            email: '',
            role: '',
            org: '',
            img: '',
            phone: '',
        }
        
        // this.logger.info(`SDS: Reading profile logged in: ${loggedIn}, webId: ${webId}`);
        if ( loggedIn && undefined != session && '' != webId) {
            // await this.rdfService.loadResource(webId);
            await this.rdfService.ensureLoaded(webId);
            const profileUrl = this.rdfService.getProfileUrl(webId) ?? '';
            if ('' != profileUrl) {
                // this.logger.info(`SDS: Reading profile logged in: ${loggedIn}, webId: ${webId}, profile url: ${profileUrl}`);
                const ownerWebid = this.rdfService.getOwnerWebId(profileUrl);
                profile.name = this.rdfService.getValue(webId, ns.FOAF('name')) ?? '';
                // profile.name = this.rdfService.getValue(null, FOAF.name) ?? '';
                profile.email = this.rdfService.getValue(webId, ns.VCARD('hasEmail')) ?? '';
                profile.role = this.rdfService.getValue(profileUrl, ns.VCARD('role')) ?? '';
                profile.org = this.rdfService.getValue(profileUrl, ns.VCARD('organization_name')) ?? '';
                profile.phone = this.rdfService.getValue(profileUrl, ns.VCARD('Cell')) ?? '';
                profile.img = this.rdfService.getValue(profileUrl, ns.FOAF('img')) ?? '';
                // profile.img = this.rdfService.getProfileImageUrlsContaining(profileUrl, '/public/images/profile-picture') ?? '';
                // rdfProfile.photo = (this.rdfService.getLiteral(profileUrl, FOAF.img) || this.rdfService.getLiteral(profileUrl, VCARD.photo)) ?? '';
            }
            // this.logger.info(`SDS: Name: ${profile.name}, email: ${profile.email}, photo: ${profile.img}`);
            this.logger.info(`SPS: Name: ${profile.name}, email: ${profile.email}, role: ${profile.role}`);
        }
        return profile;
    }

    async getVCardString(webId: string): Promise<string> {
        // const subject = $rdf.sym(webId);
        const profile = await this.getProfile();

        const vCardInfo = `BEGIN:VCARD
            VERSION:3.0
            FN:${profile?.name}
            ORG:${profile?.org}
            TITLE:${profile?.role}
            EMAIL:${profile?.email}
            TEL:${profile?.phone}
            URL:${webId}
            END:VCARD`;

        return vCardInfo;
    }

    async updateProfileSelected(profile: IProfile, fields: string[]): Promise<void> {
        const session = this.solidAuthService.getDefaultSession();
        const webId = this.solidAuthService.getWebId();
        const loggedIn = this.solidAuthService.isLoggedIn();
        // const name = profile.name ?? '';
        const email = `mailto:${profile.email}`;
        const role = profile.role ?? '';
        const org = profile.org ?? '';
        const phone = profile.phone ?? '';
        const photo = profile.img ?? '';
        
        let updates: IValueUpdate[] = [];
        // const nameUpdate: IValueUpdate = { predicate: ns.FOAF('name'), value: name, lang: 'en'};
        const roleUpdate: IValueUpdate = { predicate: ns.VCARD('role'), value: role, lang: 'en'};
        const orgUpdate: IValueUpdate = { predicate: ns.VCARD('organization_name'), value: org, lang: 'en'};
        const phoneUpdate: IValueUpdate = { predicate: ns.VCARD('Cell'), value: phone, lang: 'en'};
        // const nameUpdate: IValueUpdate = { predicateUri: FOAF.name, value: name, lang: 'en'};
        // const roleUpdate: IValueUpdate = { predicateUri: VCARD.role, value: role, lang: 'en'};
        // const orgUpdate: IValueUpdate = { predicateUri: VCARD.organization_name, value: org, lang: 'en'};
        // const phoneUpdate: IValueUpdate = { predicateUri: VCARD.Cell, value: phone, lang: 'en'};
        
        // if (selected.includes('name')) {
        //     updates.push(nameUpdate);
        // }
        
        if(fields.includes('role')) {
            updates.push(roleUpdate)
        }

        if(fields.includes('org')) {
            updates.push(orgUpdate)
        }

        if(fields.includes('phone')) {
            updates.push(phoneUpdate)
        }

        // const storageRoot = await this.solidDataService.getStorageRoot(session);
        // const resourceUrl = `${storageRoot}private/thetwin.ttl`;
        if ( loggedIn && undefined != session && '' != webId) {
            await this.rdfService.loadResource(webId);
            let profileUrl = this.rdfService.getProfileUrl(webId) ?? '';
            
            // const ownerWebid = this.rdfService.getOwnerWebId(profileUrl);
            // await this.rdfService.setValue(profileUrl, VCARD.email, email);
            await this.rdfService.upsertValues(
                webId,
                profileUrl,
                updates
            );
        }
    }

    // async updateProfile(profile: IProfile): Promise<void> {
    //     const session = this.solidAuthService.getDefaultSession();
    //     const webId = this.solidAuthService.getWebId();
    //     const loggedIn = this.solidAuthService.isLoggedIn();
    //     // const name = profile.name ?? '';
    //     const email = `mailto:${profile.email}`;
    //     const role = profile.role ?? '';
    //     const photo = profile.img ?? '';
    //     if ( loggedIn && undefined != session && '' != webId) {
    //         await this.rdfService.loadResource(webId);
    //         let profileUrl = this.rdfService.getProfileUrl(webId) ?? '';
            
    //         const ownerWebid = this.rdfService.getOwnerWebId(profileUrl);
    //         await this.rdfService.upsertValues(
    //             webId,
    //             profileUrl,
    //             [
    //                 // { predicate: ns.FOAF('name'), value: name, lang: 'en'},
    //                 { predicate: ns.VCARD('role'), value: role, lang: 'en'},
    //                 // { predicateUri: FOAF.img, value: photo, isLiteral: false, },
    //             ]
    //         );
    //     }
    // }

    async upsertProfileImage(profile: IProfile): Promise<void> {
        const session = this.solidAuthService.getDefaultSession();
        const webId = this.solidAuthService.getWebId();
        const loggedIn = this.solidAuthService.isLoggedIn();
        const photo = profile.img ?? '';
        if ( loggedIn && undefined != session && '' != webId) {
            
            const profileUrl = this.rdfService.getProfileUrl(webId) ?? '';
            if ('' != profileUrl) {
                await this.rdfService.upsertValues(
                    webId,
                    profileUrl,
                    [
                        {
                            predicate: ns.FOAF('img'),
                            value: photo,
                            isLiteral: false,
                        },
                    ]
                );   
            } else {
                this.logger.info(`SPS: Profile Picture not updated`);
            }
        }
    }

    async deleteProfileImage(): Promise<void> {
        const session = this.solidAuthService.getDefaultSession();
        const webId = this.solidAuthService.getWebId();
        const loggedIn = this.solidAuthService.isLoggedIn();
        if (loggedIn && undefined != session && '' != webId) {
            await this.rdfService.loadResource(webId);
            let profileUrl = this.rdfService.getProfileUrl(webId) ?? '';
            // await this.rdfService.setValue(profileUrl, FOAF.img, photo);
            if ('' != profileUrl) {
                this.rdfService.deleteProfileImageSparql(webId);                
            } else {
                this.logger.info(`SPS: Profile Picture not deleted.`);
            }
        }
    }

    async uploadImage(uploadUrl: string, file: any): Promise<boolean> {
        let uploadResult = false;
        uploadResult = await this.rdfService.uploadImage(file, uploadUrl)
        return uploadResult;
    }

    /** Get solid account */
    async getSolidAccount(): Promise<string> {
        let solidAccount = '';
        const webId = this.solidAuthService.getWebId();
        const triple = await this.rdfService.getTriple(null, ns.RDF('type'), ns.SOLID('Account'));
        solidAccount = triple?.subject.value ? triple?.subject.value : '';
        this.logger.info(`SPS Solid Account: ${solidAccount}`);
        return solidAccount;
    }
}
