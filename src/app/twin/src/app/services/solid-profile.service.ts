import { Injectable } from '@angular/core';
import { LocalStorageService, LoggerService, RdfService, SolidAuthService, SolidDataService } from '@app/services';
import { FOAF, VCARD } from '@inrupt/vocab-common-rdf';
import { RdfProfile } from '@app/interfaces';

@Injectable({
    providedIn: 'root'
})
export class SolidProfileService {

    // session = getDefaultSession();
    constructor(
            private logger: LoggerService,
            private solidAuthService: SolidAuthService,
            private solidDataService: SolidDataService,
            private rdfService: RdfService,
            private localStorageService: LocalStorageService
    ) { }
    
    getProfileUrl(webId: string): string {
        let profileUrl = '';
        profileUrl = this.rdfService.getProfileUrl(webId);
        return profileUrl;
    }

    async readProfile(): Promise<RdfProfile | null> {
        const session = this.solidAuthService.getDefaultSession();
        const webId = this.solidAuthService.getWebId();
        const loggedIn = this.solidAuthService.isLoggedIn();
        let rdfProfile: RdfProfile = {
            webId: webId,
            name: '',
            email: '',
            role: '',
            org: '',
            img: '',
        }
        
        this.logger.info(`SDS: Reading profile logged in: ${loggedIn} ${webId}`);
        if ( loggedIn && undefined != session && '' != webId) {
            await this.rdfService.loadResource(webId);
            let profileUrl = this.rdfService.getProfileUrl(webId) ?? '';
            if ('' != profileUrl) {
                const ownerWebid = this.rdfService.getOwnerWebId(profileUrl);
                rdfProfile.name = this.rdfService.getValue(ownerWebid, FOAF.name) ?? '';
                rdfProfile.email = this.rdfService.getValue(ownerWebid, VCARD.hasEmail) ?? '';
                rdfProfile.role = this.rdfService.getValue(ownerWebid, VCARD.role) ?? '';
                rdfProfile.org = this.rdfService.getValue(ownerWebid, VCARD.organization_name) ?? '';
                rdfProfile.img = await this.rdfService.getProfileImageUrlsContaining(webId, '/public/images/profile-picture') ?? '';
                // rdfProfile.photo = (this.rdfService.getLiteral(profileUrl, FOAF.img) || this.rdfService.getLiteral(profileUrl, VCARD.photo)) ?? '';
            }
            this.logger.info(`SDS: Name, email, photo: ${rdfProfile.name}, ${rdfProfile.email}, ${rdfProfile.img}`);
        }
        return rdfProfile;
    }

    async updateProfile(profile: RdfProfile): Promise<void> {
        const session = this.solidAuthService.getDefaultSession();
        const webId = this.solidAuthService.getWebId();
        const loggedIn = this.solidAuthService.isLoggedIn();
        const name = profile.name ?? '';
        const email = `mailto:${profile.email}`;
        // const role = profile.role ?? '';
        const photo = profile.img ?? '';
        // const storageRoot = await this.solidDataService.getStorageRoot(session);
        // const resourceUrl = `${storageRoot}private/thetwin.ttl`;
        if ( loggedIn && undefined != session && '' != webId) {
            await this.rdfService.loadResource(webId);
            let profileUrl = this.rdfService.getProfileUrl(webId) ?? '';
            const ownerWebid = this.rdfService.getOwnerWebId(profileUrl);

            // await this.rdfService.setValue(profileUrl, VCARD.email, email);
            await this.rdfService.setValues(
                webId,
                profileUrl,
                [
                    { predicate: FOAF.name, value: name, lang: 'en', },
                    { predicate: VCARD.email, value: email, isLiteral: false, },
                    // { predicate: VCARD.role, value: role, isLiteral: false, },
                    { predicate: FOAF.img, value: photo, isLiteral: false, },
                ]
            );
        }
    }

    async updateProfileImage(profile: RdfProfile): Promise<void> {
        const session = this.solidAuthService.getDefaultSession();
        const webId = this.solidAuthService.getWebId();
        const loggedIn = this.solidAuthService.isLoggedIn();
        const photo = profile.img ?? '';
        if ( loggedIn && undefined != session && '' != webId) {
            
            let profileUrl = this.rdfService.getProfileUrl(webId) ?? '';
            if ('' != profileUrl) {
                await this.rdfService.setValues(
                    webId,
                    profileUrl,
                    [
                        {
                            predicate: FOAF.img,
                            value: photo,
                            isLiteral: false,
                        },
                    ]
                );   
            } else {
                this.logger.info(`PS: Profile Picture not updated`);
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
                this.rdfService.deleteProfileImage(webId);                
            } else {
                this.logger.info(`PS: Profile Picture not deleted.`);
            }
        }
    }

    async uploadImage(uploadUrl: string, file: any): Promise<boolean> {
        let uploadResult = false;
        uploadResult = await this.rdfService.uploadImage(file, uploadUrl)
        return uploadResult;
    }
}
