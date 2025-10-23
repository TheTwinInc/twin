import { Injectable } from '@angular/core';
import { IContactProfile } from '@app/interfaces';
import { BehaviorSubject, catchError, Observable, of } from 'rxjs';
import { LoggerService, RdfService, SolidAuthService } from '@app/services';
import { FOAF, VCARD } from '@inrupt/vocab-common-rdf';
import { HttpClient, HttpHeaders, HttpParams, HttpParamsOptions } from '@angular/common/http';
// import

import { NamedNode, Quad } from 'rdflib/lib/tf-types';
import * as $rdf from 'rdflib';
import { ns } from '@app/utils';
// const FOAF = $rdf.Namespace('http://xmlns.com/foaf/0.1/');
// const VCARD = $rdf.Namespace('http://www.w3.org/2006/vcard/ns#');

@Injectable({
    providedIn: 'root'
})
export class ContactService {
    private _contacts: IContactProfile[] = [];
    contacts = new BehaviorSubject<IContactProfile[]>(this._contacts)

    constructor(
        private rdfService: RdfService,
        // private solidAuthService: SolidAuthService,
        private logger: LoggerService,
        private http: HttpClient,
    ) { }

    async getContacts(webId: string | undefined) {
        if (undefined != webId && '' != webId)   {
            // this.loading = true;
            // this._contacts = await this.rdfService.getContacts(webId);
            // let contacts = await this.rdfService.getContacts(webId);
            const subject = this.rdfService.getProfileUrl(webId);
            const predicate = ns.FOAF('knows');
            if (null != subject) {
                // this.logger.info(`CS: Contacts request: ${subject}, ${predicate}`);
                const contacts = await this.rdfService.getTriples(subject, predicate, null);
                this.logger.info(`CS: Contacts: ${JSON.stringify(contacts)}`);
                if (undefined != contacts) {
                    let filledContacts: IContactProfile[] = [];
                    for (let index = 0; index < contacts.length; index++) {
                        const contact = contacts[index];
                        const filledContact = await this.createContactProfile(contact.object.value);
                        filledContacts.push(filledContact);
                    }
                    this._contacts = filledContacts;

                    this.logger.info(`CS: Contacts filled: ${JSON.stringify(filledContacts)}`);
                }
            }
            
            
            // this._contacts = filledContacts;
            // this._contacts = await this.rdfService.getContacts(webId);
            // this.logger.info(`CS: Contacts: ${JSON.stringify(this._contacts)}`)
            // this.loading = false;
            this.broadcastContacts();
        }
    }

    async getContact(subjectUri: string, contactWebId: string): Promise<Quad | null> {
        const predicate = $rdf.sym(FOAF.knows);
        const subject = $rdf.sym(subjectUri);
        const object = $rdf.literal(contactWebId);
        const contact = await this.rdfService.getTriple(subject, predicate, object);
        return contact;
    }

    async addContact(webId: string, contactWebId: string) {
        try {
            if (webId && contactWebId) {
                const predicate = ns.FOAF('knows');
                const subject = this.rdfService.getProfileUrl(webId);
                if (null != subject) {
                    const addedContact = await this.rdfService.addTriple(subject, predicate, contactWebId);
                    // const addedContact = await this.rdfService.addTripleGM(webId, predicate, contactWebId);
                    if (addedContact) {
                        await this.addToContacts(contactWebId);
                        this.broadcastContacts();
                        this.logger.debug(`Added contact: ${contactWebId}`);
                    }
                }
                
            }
        } catch (error: any) {
            this.logger.error(`Failed to add contact: ${error.message}`);
        }
    }

    async addToContacts(contactWebId: string) {
        const contact = await this.createContactProfile(contactWebId);
        this.logger.info(`CS: Add contact: ${JSON.stringify(contact)}`);
        this._contacts.push(contact);
    }

    async createContactProfile(contact: any) {
        let contactProfile: IContactProfile = {
            webId: contact,
            name: 'Unknown',
            email: '',
            org: '',
            role: '',
            img: '',
        };
        try {
            if (undefined != contact) {
                await this.rdfService.getContactInfo(contactProfile, contact);
            }
        } catch (error) {
            this.logger.error(`RDF: Error mapping contact: ${error}`);
        } finally {
            return contactProfile;
        }
    }
    
    

    async reloadContacts(webId: string) {
        await this.getContacts(webId);
    }

    async removeContact(webId: string, contact: IContactProfile): Promise<void> {
        let removedContact = false;
        let subjectUri = this.rdfService.getProfileUrl(webId);
        this.logger.info(`CS: Contact to remove: ${JSON.stringify(contact)}, from: ${JSON.stringify(subjectUri)}`);
        try {
            if (undefined != subjectUri) {
                const existingContact = await this.getContact(subjectUri, contact.webId);
                // this.logger.info(`CS: Existing contact to remove: ${JSON.stringify(existingContact)}`);
                if (existingContact) {
                    removedContact = await this.rdfService.deleteTripleState(existingContact);
                    if (removedContact) {
                        this.rdfService.deleteTripleFromStore(existingContact);
                    }
                }
                if (removedContact) {
                    this.deleteContact(contact);
                }
            }
        } catch (error: any) {
            this.logger.error(`Failed to delete contact: ${error.message}`);
        }
    }

    // deleteAirport(airport: IAirport) {
    //     this._airports = this._airports.filter(({ code }) => code !== airport.code);
    //     this.broadcastAirports();
    // }

    // deleteAirports(airports: IAirport[]) {
    //     airports.forEach( (airport) => {
    //         this._airports = this._airports.filter(({ code }) => code !== airport.code);
    //     })
    //     this.broadcastAirports();
    // }

    deleteContact(contact: IContactProfile) {
        this._contacts = this._contacts.filter(({ webId }) => webId !== contact.webId);
        this.broadcastContacts();
    }
    // deleteAirport(airport: IAirport) {
    //     this._airports = this._airports.filter(({ code }) => code !== airport.code);
    //     this.broadcastAirports();
    // }

    private broadcastContacts(): void {
        this.contacts.next(this._contacts);
    }

    private handleError<T>(operation = 'operation', result?: T) {
        return (error: any): Observable<T> => {
      
            this.logger.error(`${operation} failed: ${error.message}`);
        
            // Let the app keep running by returning an empty result.
            return of(result as T);
        };
    }
}
