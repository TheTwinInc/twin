import { Injectable } from '@angular/core';
import { FriendProfile, ProfileData, RdfProfile, RdfUpdate } from '@app/interfaces';
import { LoggerService, SolidAuthService } from '@app/services';
import { getWebIdDataset } from '@inrupt/solid-client';
import { Session } from '@inrupt/solid-client-authn-browser';
// import { removeUrl } from '@inrupt/solid-client';

// import rdfParser from 'rdf-parse';
import * as $rdf from 'rdflib';
import { NamedNode, Quad_Object, Term } from 'rdflib/lib/tf-types';
const LDP = $rdf.Namespace('http://www.w3.org/ns/ldp#>');
const FOAF = $rdf.Namespace('http://xmlns.com/foaf/0.1/');
const XSD  = $rdf.Namespace('http://www.w3.org/2001/XMLSchema#');
const RDF = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
const RDFS = $rdf.Namespace("http://www.w3.org/2000/01/rdf-schema#");
const SCHEMA = $rdf.Namespace('http://schema.org/');
const SOLID = $rdf.Namespace('http://www.w3.org/ns/solid/terms#');
const VCARD = $rdf.Namespace('http://www.w3.org/2006/vcard/ns#');
const ORG = $rdf.Namespace('http://www.w3.org/ns/org#');
const PIM = $rdf.Namespace('http://www.w3.org/ns/pim/space#');



@Injectable({
    providedIn: 'root'
})
export class RdfService {
    private store = $rdf.graph();
    private fetcher: $rdf.Fetcher;
    private updater: $rdf.UpdateManager;
    private hyperFetcher: any;

    constructor(
        private logger: LoggerService,
        private solidAuthService: SolidAuthService
    ) {
        // const fetchWithAuth = this.solidAuthService.getSession().fetch;
        this.store = this.createStore();
        // const fetchWithAuth = this.solidAuthService.getDefaultSession().fetch;
        
        this.updater = this.createUpdater();
        // this.fetcher = this.createFetcher();
        this.fetcher = this.createHyperFetcher();
    }

    isLoggedIn(): boolean {
        return this.solidAuthService.isLoggedIn();
    }

    createStore():$rdf.Store {
        const store = $rdf.graph();
        return store;
    }

    createHyperFetcher() {
        const hyperFetch = (input: string | URL | globalThis.Request, init?: any) => {
            if (!init) {
                init = {};
            }
            if (!init.headers) {
                init.headers = {}
            }
            init.headers.hypergraph = 'U2FsdGVkX1/S0rANmPZVe3xCIXvlGoGnGudwlp4wFSMFtte++kYYPt0l4B4407c+'
            const session = this.solidAuthService.getDefaultSession();
            return session.fetch(input, init);
        }

        return new $rdf.Fetcher(this.store, { fetch: hyperFetch });
    }

    createFetcher() {
        const fetchWithAuth = this.solidAuthService.getDefaultSession().fetch;
        return new $rdf.Fetcher(this.store, { fetch: fetchWithAuth });
    }

    createUpdater(): $rdf.UpdateManager {
        return new $rdf.UpdateManager(this.store);
    }

    /**
     * Load RDF resource into store
     */
    async loadResource(resourceUrl: string | NamedNode): Promise<void> {
        await this.fetcher.load(resourceUrl);
    }

    async listAllTriples(webId: string) {
        // List all triples
        const webIdDoc = webId.split('#')[0];
        await this.loadResource(webIdDoc);
        const allTriples = this.store.statementsMatching(null, null, null);

        allTriples.forEach(triple => {
            this.logger.info(triple.toNT()); // Print triple in N-Triples format
        });
    }

    async listAllTriplesAsTurtle (webId: string) {
        // List all triples
        const webIdDoc = webId.split('#')[0];
        await this.loadResource(webIdDoc);

        const triples = this.store.statementsMatching(null, null, null);
        triples.forEach(triple => {
            this.logger.info(triple.toNT()); // Print triple in N-Triples format
        });
    }
    
    listData(uri: string) {
        let folder = $rdf.sym(uri);  // NOTE: Ends in a slash
        // const store = this.createStore();
        // const fetcher = this.createFetcher(store);

        this.loadResource(folder).then(() => {
            let files = this.store.any(folder, LDP('contains'));
            this.logger.info(`Files ${files}`)
        });
    }

    listFolders(uri: string) {
        let folder = $rdf.sym(`${uri}`);  // NOTE: Ends in a slash
        // const store = this.createStore();
        // const fetcher = this.createFetcher(store);

        this.loadResource(folder).then(() => {
            let files = this.store.any(folder, LDP('contains'));
            this.logger.info(`Files ${files}`)
        });
    }

    // parseContent(data: string):Promise<$rdf.Store | any> {
    parseContent(data: string) {
        let returnStore = {};
        if (undefined != data) {
            let uri = '';
            // let store = this.createStore();
            var kb = new $rdf.IndexedFormula();
            var mimeType = 'application/rdf+xml';
            // let mimeType = 'text/turtle';
            // let mimeType = 'text/html';

            try {
                $rdf.parse(data, kb, uri, mimeType, (error, kb) => {
                    if(!error) {
                        if (undefined != kb) {
                            $rdf.serialize(null, kb, undefined, 'text/turtle', (err, str) => {
                                this.logger.info(`Serialize: ${str}`);
                            });
                        }
                    } else {
                        this.logger.error(error);
                    }
                });
            } catch (err) {
                this.logger.error(err);
            }
            // returnStore = store;
        }
        // return returnStore;
    }

    rdfParser() {

    }

    addQuad(subject: Term, predicate: Term, object: Term, graph: Term | undefined = undefined) {
        $rdf.quad(subject, predicate, object, graph);
    }

    // REVIEW
    async loadDocument(docUrl: string): Promise<$rdf.Formula | null> {
        if (!this.isLoggedIn()) {
            return null;
        } else {
            // this.store = $rdf.graph();
            // const fetchWithAuth = this.solidAuthService.getDefaultSession().fetch;
            // this.fetcher = new $rdf.Fetcher(this.store, { fetch: fetchWithAuth });
            // this.updater = new $rdf.UpdateManager(this.store);

            await this.loadResource(docUrl);
            return this.store;
        }
    }

    getTriples(subjectUri: string): $rdf.Statement[] {
        return this.store.statementsMatching($rdf.sym(subjectUri), null, null);
    }

    async addTriple(docUrl: string, subjectUri: string, predicate: string, object: string | $rdf.NamedNode): Promise<void> {
        if (!this.isLoggedIn()) {
            return Promise.reject('Not logged in');
        } else {
            const subject = $rdf.sym(subjectUri);
            const pred = $rdf.sym(predicate);
            const obj = typeof object === 'string' ? $rdf.literal(object) : object;
            const statement = $rdf.st(subject, pred, obj, $rdf.sym(docUrl));

            return new Promise<void>((resolve, reject) => {
            this.updater.update([], [statement], (uri, ok, message) => {
                if (ok) resolve();
                    else reject(new Error(message || 'Failed to add triple.'));
                });
            });
        }

        
    }

    async deleteTriple(docUrl: string, subjectUri: string, predicate: string, object: string): Promise<void> {
        if (!this.isLoggedIn()) {
            return Promise.reject('Not logged in');
        } else {
            const subject = $rdf.sym(subjectUri);
            const pred = $rdf.sym(predicate);
            const obj = $rdf.literal(object);
            const statement = $rdf.st(subject, pred, obj, $rdf.sym(docUrl));

            return new Promise<void>((resolve, reject) => {
                this.updater.update([statement], [], (uri, ok, message) => {
                    if (ok) {
                        resolve();
                    }
                    else {
                        reject(new Error(message || 'Failed to delete triple.'));
                    }
                });
            });
        }
    }

    async updateTriple(
        docUrl: string,
        subjectUri: string,
        predicate: string,
        oldValue: string,
        newValue: string
    ): Promise<void> {
        if (!this.isLoggedIn()) {
            return Promise.reject('Not logged in');
        } else {
            const subject = $rdf.sym(subjectUri);
            const pred = $rdf.sym(predicate);
            const oldObj = $rdf.literal(oldValue);
            const newObj = $rdf.literal(newValue);
            const oldStmt = $rdf.st(subject, pred, oldObj, $rdf.sym(docUrl));
            const newStmt = $rdf.st(subject, pred, newObj, $rdf.sym(docUrl));

            return new Promise<void>((resolve, reject) => {
            this.updater.update([oldStmt], [newStmt], (uri, ok, message) => {
                    if (ok) resolve();
                    else reject(new Error(message || 'Failed to update triple.'));
                });
            });
        }
    }

    async findMembershipContainers(webId: string): Promise<string[]> {
        try {
            // 1. Load the profile document of the WebID
            const webIdDoc = webId.split('#')[0];
            await this.loadResource(webIdDoc);

            // 2. Look for inverse membership (you being a member of a group/container)
            const me = $rdf.sym(webId);
            const matches = this.store.match(null, FOAF('member'), me)
                .concat(this.store.match(null, SCHEMA('member'), me))
                .concat(this.store.match(null, SOLID('hasMember'), me))
                .concat(this.store.match(null, VCARD('hasMember'), me));

            // this.logger.info(`RFD: Matches: ${JSON.stringify(matches)}`);

            // 3. Extract unique subject URIs where you are listed as a member
            const containers = Array.from(new Set(matches.map(quad => quad.subject.value)));
            // this.logger.info(`RFD: Containers: ${JSON.stringify(containers)}`);

            // 4. Get all pim:storage triples
            const storages = this.store.each(me, PIM('storage'), null);

            const pods =  storages.map(node => node.value);
            // this.logger.info(`RFD: Pods: ${JSON.stringify(pods)}`);

            return pods.concat(containers);
        } catch (error) {
            this.logger.error(`RDF: Error fetching membership data: ${error}`, );
            return [];
        }
    }

    /**
     * Get a owner webId from the RDF store
     */
    getOwnerWebId(profileDocUrl: string): string {
        let returnOwner = '';
        const profileDoc = $rdf.sym(profileDocUrl);
        const triples = this.store.match(profileDoc, FOAF('maker'), null);

        if (triples.length > 0) {
            returnOwner = triples[0].object.value;
        }
        return returnOwner;
    }

    // getLiteral(subjectUri: string, predicateUrl: $rdf.NamedNode): string | undefined {
    getLiteral(subjectUrl: string, predicateUrl: string): string | undefined {
        const subject = $rdf.sym(subjectUrl);
        const predicate = $rdf.sym(predicateUrl);
        const node = this.store.any(subject, predicate);
        return node?.termType === 'Literal' ? node.value : undefined;
    }

    /**
     * Get a value from the RDF store
     */
    getValue(subjectUrl: string, predicateUrl: string): string | null {
        const subject = $rdf.sym(subjectUrl);
        const predicate = $rdf.sym(predicateUrl);
        const value = this.store.any(subject, predicate);
        return value?.value || null;
    }

    /**
     * Set (add/update) a value in the RDF store
     */
    async setValue(subjectUrl: string, predicateUrl: string, value: string): Promise<void> {
        const subject = $rdf.sym(subjectUrl);
        const predicate = $rdf.sym(predicateUrl);
        const doc = subject.doc();
        const literalValue = $rdf.literal(value);

        const existingValue = this.store.any(subject, predicate, undefined, doc);

        const deletions = existingValue ? [$rdf.st(subject, predicate, existingValue, doc)] : [];
        const insertions = [$rdf.st(subject, predicate, literalValue, doc)];

        return new Promise((resolve, reject) => {
            this.updater.update(deletions, insertions, (uri, ok, message) => {
                if (ok) resolve();
                else reject(new Error(message));
            });
        });
    }

    /**
     * Remove a value from the RDF store
     */
    async removeValue(subjectUrl: string, predicateUrl: string): Promise<void> {
        const subject = $rdf.sym(subjectUrl);
        const predicate = $rdf.sym(predicateUrl);
        const doc = subject.doc();

        const existingValue = this.store.any(subject, predicate, undefined, doc);

        if (!existingValue) return;

        const deletion = [$rdf.st(subject, predicate, existingValue, doc)];

        return new Promise((resolve, reject) => {
            this.updater.update(deletion, [], (uri, ok, message) => {
                if (ok) resolve();
                else reject(new Error(message));
            });
        });
    }

    async setValues(profileDocUrl: string, subjectUri: string, updates: RdfUpdate[]): Promise<void> {
        await this.loadResource(profileDocUrl);

        const subject = $rdf.sym(subjectUri);
        const doc = $rdf.sym(profileDocUrl);

        const deletions: $rdf.Statement[] = [];
        const insertions: $rdf.Statement[] = [];
        

        for (const { predicate, value, isLiteral = true, lang } of updates) {
            const predNode = $rdf.sym(predicate);
            const existingValue = this.store.any(subject, predNode, undefined, doc);
            const deletion = existingValue ? $rdf.st(subject, predNode, existingValue, doc) : null;

            if (undefined != deletion) {
                deletions.push(deletion);
            }
            
            const object = isLiteral ? $rdf.literal(value, lang) : $rdf.sym(value);

            insertions.push($rdf.st(subject, predNode, object, doc));
        }

        return new Promise<void>((resolve, reject) => {
            this.updater.update(deletions, insertions, (uri, ok, message) => {
                if (!ok) reject(new Error(message));
                else resolve();
            });
        });
    }


    getProfileUrl(webId: string): string {
        let profileUri = '';
        const webIdNode = $rdf.sym(webId);
        // const profileTriples = this.store.match(null, RDF('type'), FOAF('PersonalProfileDocument'));
        // const profileTriples = this.store.match(doc, RDF('type'), FOAF('PersonalProfileDocument'));
        // Find triples: ?doc foaf:maker <webId>
        const matches = this.store.match(null, FOAF('maker'), webIdNode);

        for (const triple of matches) {
            const isProfileDoc = this.store.holds(triple.subject, RDF('type'), FOAF('PersonalProfileDocument'));
            if (isProfileDoc) {
                profileUri = triple.subject.value; // This is the profile document URL
                break;
            }
        }
        return profileUri
    }

    /**
     * Uploads a file to the given URL in the Solid Pod.
     */
    async uploadImage(file: File, targetUrl: string): Promise<boolean> {
        let uploadResult = false
        const res = await this.solidAuthService.getDefaultSession().fetch(targetUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type },
            body: file,
        });

        if (res.ok) {
            uploadResult = true;
        } else {
            this.logger.error(`Image upload failed: ${res.statusText}`);
        }
        return uploadResult;
    }

    async setProfileImage(profileDocUrl: string, imageUrl: string): Promise<void> {
        // const profileDoc = webId.split('#')[0];
        const subjectUri = this.getProfileUrl(profileDocUrl);
        const subject = $rdf.sym(subjectUri);
        // const me = $rdf.sym(webId);
        const doc = $rdf.sym(profileDocUrl);
        const predicate = FOAF('img');

        await this.loadResource(profileDocUrl);

        const existing = this.store.match(subject, predicate, null, doc) as $rdf.Statement[];
        const newStmt = $rdf.st(subject, predicate, $rdf.sym(imageUrl), doc);

        await new Promise<void>((resolve, reject) => {
            this.updater.update(existing, [newStmt], (uri, ok, msg) => {
            if (ok) resolve();
            else reject(new Error(msg));
            });
        });
    }

    /**
     * Removes the foaf:img triple from the user's profile RDF.
     */
    async deleteProfileImage(profileDocUrl: string): Promise<void> {
        const subjectUri = this.getProfileUrl(profileDocUrl);
        const subject = $rdf.sym(subjectUri);
        const doc = $rdf.sym(profileDocUrl);
        const predicate = FOAF('img');

        await this.loadResource(profileDocUrl);

        const existingStatements = this.store.match(subject, predicate, null, doc) as $rdf.Statement[];

        if (existingStatements.length === 0) {
            this.logger.info('No profile image found to remove.');
        } else {
            await new Promise<void>((resolve, reject) => {
                this.updater.update(existingStatements, [], (uri, ok, message) => {
                    if (ok) resolve();
                    else reject(new Error(message));
                });
            });
        }
    }

    /**
     * Get all profile images.
     */
    async getProfileImageUrlsContaining(profileDocUrl: string, filename: string): Promise<string> {
        let profileImageUrl = '';
        const subjectUri = this.getProfileUrl(profileDocUrl);
        const subject = $rdf.sym(subjectUri);
        const doc = $rdf.sym(profileDocUrl);

        await this.loadResource(profileDocUrl);

        const predicates = [FOAF('img'), VCARD('photo')];

        for (const predicate of predicates) {
            const images = this.store.each(subject, predicate, null, doc)
            .filter((node): node is $rdf.NamedNode => node.termType === 'NamedNode');

            const match = images.find(node => node.value.includes(filename));
            if (match) {
                profileImageUrl = match.value;
            }
        }
        return profileImageUrl;
    }

    /**
     * List images in folder.
     */
    async listImagesInFolder(folderUrl: string): Promise<string[]> {
        const LDP = $rdf.Namespace('http://www.w3.org/ns/ldp#');
        await this.loadResource(folderUrl);

        const folder = $rdf.sym(folderUrl);
        const contents = this.store.match(folder, LDP('contains'), null, folder);

        return contents
            .map(st => st.object.value)
            .filter(url => /\.(jpg|jpeg|png|gif)$/i.test(url));
    }

    /**
     * Add knows relations.
     */
    async addKnowsRelation(profileDocUrl: string, knownWebId: string): Promise<void> {
        const subjectUri = this.getProfileUrl(profileDocUrl);
        const subject = $rdf.sym(subjectUri);
        const doc = $rdf.sym(profileDocUrl);
        const predicate = FOAF('knows');
        const newFriend = $rdf.sym(knownWebId);

        await this.loadResource(profileDocUrl);

        const stmt = $rdf.st(subject, predicate, newFriend, doc);

        await new Promise<void>((resolve, reject) => {
            this.updater.update([], [stmt], (uri, ok, msg) => {
                if (ok) resolve();
                else reject(new Error(msg));
            });
        });
    }

    async getContacts(profileDocUrl: string): Promise<FriendProfile[]> {
        const subject = this.extractSubjectFromProfileDocurl(profileDocUrl);
        const doc = $rdf.sym(profileDocUrl);
        const predicate = FOAF('knows');
        
        await this.loadResource(profileDocUrl);

        const knowsNodes = this.store.each(subject, predicate, null, doc);

        const knownPeople = knowsNodes.filter(this.isNamedNode);

        return Promise.all(
            knownPeople.map(async (person) => {
                // let name = 'Unknown';
                // let email = '';
                // let org = '';
                // let role = '';
                // let img = null;
                let personProfile: FriendProfile = {
                    webId : '',
                    name : 'Unknown',
                    email : '',
                    org : '',
                    role : '',
                    img : '',
                };
                try {
                    if ($rdf.isNamedNode(person)) {
                        // await this.loadResource(person.doc());
                        await this.loadResource(person);
                        personProfile.webId = person.value;
                        personProfile.name =
                            this.getLiteralValue(person, FOAF('name')) ??
                            this.getLiteralValue(person, VCARD('fn')) ??
                            'Unknown';
                        personProfile.email = this.getUriValue(person, VCARD('hasEmail')) ?? '';
                        personProfile.org = this.getUriValue(person, VCARD('organization-name')) ?? '';
                        personProfile.role = this.getUriValue(person, VCARD('role')) ?? '';
                        personProfile.img =
                            this.getUriValue(person, FOAF('img')) ??
                            this.getUriValue(person, VCARD('photo')) ?? '';
                        // personProfile.name = name;

                    }
                    // return { webId: person.value, name, img };
                    // return { webId: person.value, name, img };

                    
                } catch (error) {
                    this.logger.error(`RDFS: Error mapping contact: ${error}`)
                    // return { webId: person.value, name: 'Unknown', img: null };
                } finally {
                    return personProfile
                }
            })
        );
    }

    private extractSubjectFromProfileDocurl(profileDocUrl: string): NamedNode | null {
        let subject = null;
        this.logger.info(`RDF: Profile doc url: ${profileDocUrl}`);
        const subjectUri = this.getProfileUrl(profileDocUrl);
        this.logger.info(`RDF: Subject url: ${subjectUri}`);
        if ('' != subjectUri) {
            subject = $rdf.sym(subjectUri);
        }
        return subject;
    }

    /** Check if a node is a NamedNode (IRI) */
    private isNamedNode(node: Term | null): node is NamedNode {
        return !!node && node.termType === 'NamedNode';
    }

    /** Return literal string value for a given subject + predicate */
    private getLiteralValue(subject: NamedNode, predicate: NamedNode): string | null {
        const value = this.store.any(subject, predicate);
        return value?.termType === 'Literal' ? value.value : null;
    }

    /** Return URI value for a given subject + predicate */
    private getUriValue(subject: NamedNode, predicate: NamedNode): string | null {
        const value = this.store.any(subject, predicate);
        return value?.termType === 'NamedNode' ? value.value : null;
    }

    async getProfileData(webId: string): Promise<RdfProfile> {
        const subject = $rdf.sym(webId);
        await this.loadResource(subject.doc());

        const profileData: RdfProfile = {
            webId: webId,
            name:
                this.store.any(subject, FOAF('name'))?.value ||
                this.store.any(subject, VCARD('fn'))?.value ||
                'Unknown',
            img: await this.getProfileImageUrlsContaining(webId, '/public/images/profile-picture') ?? null,
            org: this.store.any(subject, VCARD('organization-name'))?.value || '',
            role: this.store.any(subject, VCARD('role'))?.value || '',
        }

        return profileData;
    }

    async getVCardString(webId: string): Promise<string> {
        const subject = $rdf.sym(webId);
        const profile = await this.readProfile(webId);

        const vCardInfo = `BEGIN:VCARD
        VERSION:3.0
        FN:${profile?.name}
        ORG:${profile?.org}
        TITLE:${profile?.role}
        EMAIL:${profile?.email}
        TEL:${profile?.phone}
        URL:${webId}
        END:VCARD`;
        // return this.loadResource(subject.doc()).then(() => {
        //     // const fn =
        //     // this.store.any(subject, VCARD('fn'))?.value ||
        //     // this.store.any(subject, FOAF('name'))?.value ||
        //     // 'Unknown';

        //     // const org = this.store.any(subject, VCARD('organization-name'))?.value || '';
        //     // const title = this.store.any(subject, VCARD('role'))?.value || '';
        //     // const email = this.store.any(subject, VCARD('email'))?.value?.replace('mailto:', '') || '';
        //     // const phone = this.store.any(subject, VCARD('hasTelephone'))?.value?.replace('tel:', '') || '';
            
            
        // });
        return vCardInfo;
    }

    // async readProfile(): Promise<RdfProfile | null> {
    async readProfile(profileDocUrl: string): Promise<RdfProfile | null> {
        // const session = this.solidAuthService.getDefaultSession();
        // const webId = this.solidAuthService.getWebId();
        // const loggedIn = this.solidAuthService.isLoggedIn();
        const subjectUri = this.getProfileUrl(profileDocUrl);
        const subject = $rdf.sym(subjectUri);
        const doc = $rdf.sym(profileDocUrl);
        const webId = profileDocUrl;
        
        let rdfProfile: RdfProfile = {
            webId: webId,
            name: '',
            email: '',
            role: '',
            img: '',
        }

        await this.loadResource(profileDocUrl);

        let profileUrl = this.getProfileUrl(webId) ?? '';
        if ('' != profileUrl) {
            const ownerWebid = this.getOwnerWebId(profileUrl);
            rdfProfile.name = this.store.any(subject, FOAF('name'))?.value ?? '';
            rdfProfile.email = this.store.any(subject, VCARD('hasEmail'))?.value ?? '';
            rdfProfile.role = this.store.any(subject, VCARD('role'))?.value ?? '';
            rdfProfile.org = this.store.any(subject, VCARD('organization_name'))?.value ?? '';
            rdfProfile.img = await this.getProfileImageUrlsContaining(webId, '/public/images/profile-picture') ?? '';
            // rdfProfile.photo = (this.rdfService.getLiteral(profileUrl, FOAF.img) || this.rdfService.getLiteral(profileUrl, VCARD.photo)) ?? '';
        }
        this.logger.info(`SDS: Name, email, photo: ${rdfProfile.name}, ${rdfProfile.email}, ${rdfProfile.img}`);
        return rdfProfile;
    }
    
    // fetchSolidProfile(profileUrl: string): Observable<any> {
    //     const headers = new HttpHeaders({
    //     'Accept': 'text/turtle,application/rdf+xml' // Request RDF formats
    //     });

    //     return from(this.loadResource(profileUrl)).pipe(
    //     map(() => {
    //         try {
    //         // Extract data from the RDF store
    //         const person = $rdf.sym(profileUrl);
    //         const foaf = $rdf.Namespace('http://xmlns.com/foaf/0.1/');
            
    //         // Get name (foaf:name)
    //         const name = this.store.any(person, foaf('name'))?.value || 'No name found';
            
    //         // Get friends (foaf:knows)
    //         const friends = this.store.match(person, foaf('knows')).map(triple => triple.object.value);

    //         return { name, friends };
    //         } catch (error) {
    //         console.error('Error processing RDF:', error);
    //         throw error;
    //         }
    //     })
    //     );
    // }

    // getProfileData(profileUrl: string): Observable<any> {
    //     const headers = new HttpHeaders({
    //         'Accept': 'text/turtle, application/rdf+xml, application/ld+json'
    //     });

    //     return this.http.get(profileUrl, { headers, responseType: 'text' }).pipe(
    //         map(data => this.parseRdfData(data, profileUrl)),
    //         catchError(this.handleError<any>('getProfileData', {}))
    //     );
    // }

    // private extractProfileData(profileUri: string): any {
    //     const FOAF = $rdf.Namespace('http://xmlns.com/foaf/0.1/');
    //     const SCHEMA = $rdf.Namespace('http://schema.org/');
    //     const GMX = $rdf.Namespace('http://graphmetrix.com/ontology#'); // Hypothetical custom namespace
    //     const person = $rdf.sym(profileUri);

    //     const name = this.store.any(person, FOAF('name')) || this.store.any(person, SCHEMA('name'));
    //     const friends = this.store.each(person, FOAF('knows'));
    //     const projects = this.store.each(person, GMX('hasProject')); // Custom property example

    //     return {
    //         name: name?.value || 'Unknown',
    //         friends: friends.map(friend => friend.value),
    //         projects: projects.map(project => project.value)
    //     };
    // }
}
