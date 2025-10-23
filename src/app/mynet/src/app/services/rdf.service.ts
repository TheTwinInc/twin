import { HttpClient, HttpHeaders, HttpParams, HttpParamsOptions } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IContactProfile, IProfileData, IProfile, IValueUpdate, WacAllow, EffectiveAccess, AccessHeaders, AgentAuthorization } from '@app/interfaces';
import { LoggerService, SolidAuthService } from '@app/services';
// import { getWebIdDataset } from '@inrupt/solid-client';
// import { Session } from '@inrupt/solid-client-authn-browser';
// import { removeUrl } from '@inrupt/solid-client';

// import rdfParser from 'rdf-parse';
import * as $rdf from 'rdflib';
import { ns, prefixes } from '@app/utils';
// import type * as RDF from "@rdfjs/types";
import { NamedNode, Quad, Quad_Graph, Quad_Object, Quad_Predicate, Quad_Subject, Term } from 'rdflib/lib/tf-types';
import { BehaviorSubject, catchError, firstValueFrom, Observable, of } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class RdfService {
    // private store = $rdf.graph();
    private store: $rdf.Store;
    private fetcher: $rdf.Fetcher;
    private updater: $rdf.UpdateManager;
    private hyperFetcher: any;

    public ns = Object.create(null);

    httpHeaders = {
        headers: new HttpHeaders({
            Accept: 'text/turtle'   // <-- Ask explicitly for Turtle
        })
    };

    constructor(
        private logger: LoggerService,
        private solidAuthService: SolidAuthService,
        private http: HttpClient,
    ) {
        this.store = this.createStore();
        this.updater = this.createUpdater(this.store);
        this.fetcher = this.createHyperFetcher(this.store);
    }

    /** Is user logged in */
    isLoggedIn(): boolean {
        return this.solidAuthService.isLoggedIn();
    }

    /** Create service store */
    createStore():$rdf.Store {
        const store = $rdf.graph();
        return store;
    }

    /** Create hyper fetcher */
    createHyperFetcher(store: $rdf.Store) {
        const hyperFetch = (input: string | URL | globalThis.Request, init?: any) => {
            const hypergraphHash = 'U2FsdGVkX1/S0rANmPZVe3xCIXvlGoGnGudwlp4wFSMFtte++kYYPt0l4B4407c+';
            const initFetch = {
                headers: {
                    hypergraph: hypergraphHash
                }
            };
            const session = this.solidAuthService.getDefaultSession();
            return session.fetch(input, initFetch);
        }
        return new $rdf.Fetcher(store, { fetch: hyperFetch });
    }

    /** Create fetcher */
    createFetcher(store: $rdf.Store) {
        const fetchWithAuth = this.solidAuthService.getDefaultSession().fetch;
        return new $rdf.Fetcher(store, { fetch: fetchWithAuth });
    }

    /** Create updater */
    createUpdater(store: $rdf.Store): $rdf.UpdateManager {
        return new $rdf.UpdateManager(store);
    }

    /** Load RDF resource into service store */
    async loadResource(resourceUrl: string | NamedNode | undefined): Promise<void> {
        if (undefined != resourceUrl) {
            await this.fetcher.load(resourceUrl);
        }
    }

    /** Load RDF resource into store when store is empty */
    async ensureLoaded(resourceUrl: string): Promise<void> {
        const alreadyLoaded = this.store.any(undefined, undefined, undefined, $rdf.sym(resourceUrl));
        if (!alreadyLoaded) {
            await this.loadResource(resourceUrl);
        }
    }
    
    /** Load resources */
    listData(uri: string) {
        let folder = $rdf.sym(uri);  // NOTE: Ends in a slash
        this.loadResource(folder).then(() => {
            let files = this.store.any(folder, ns.LDP('contains'));
            this.logger.info(`RDF: Files ${files}`)
        });
    }

    // listFolders(uri: string) {
    //     let folder = $rdf.sym(`${uri}`);  // NOTE: Ends in a slash
    //     this.loadResource(folder).then(() => {
    //         let files = this.store.any(folder, ns.LDP('contains'));
    //         this.logger.info(`RDF: Files ${files}`)
    //     });
    // }

    // parseContent(data: string) {
    //     if (undefined != data) {
    //         let uri = '';
    //         var kb = new $rdf.IndexedFormula();
    //         var mimeType = 'application/rdf+xml';
    //         // let mimeType = 'text/turtle';
    //         // let mimeType = 'text/html';

    //         try {
    //             $rdf.parse(data, kb, uri, mimeType, (error, kb) => {
    //                 if(!error) {
    //                     if (undefined != kb) {
    //                         $rdf.serialize(null, kb, undefined, 'text/turtle', (err, str) => {
    //                             this.logger.info(`RDF: Serialize: ${str}`);
    //                         });
    //                     }
    //                 } else {
    //                     this.logger.error(error);
    //                 }
    //             });
    //         } catch (err) {
    //             this.logger.error(err);
    //         }
    //     }
    // }

    

    // async loadDocument(docUrl: string): Promise<$rdf.Formula | null> {
    //     if (!this.isLoggedIn()) {
    //         return null;
    //     } else {
    //         await this.loadResource(docUrl);
    //         return this.store;
    //     }
    // }

    // getTriples(subjectUri: string): $rdf.Statement[] {
    //     return this.store.statementsMatching($rdf.sym(subjectUri), null, null);
    // }

    /** Add a triple with Sparql */
    async addTripleSparql(docUrl: string, subjectUri: string, predicate: string, object: string | $rdf.NamedNode): Promise<void> {
        if (!this.isLoggedIn()) {
            return Promise.reject('RDF: Not logged in');
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

    /** Delete a triple with Sparql */
    async deleteTripleSparql(docUrl: string, subjectUri: string, predicate: string, object: string): Promise<void> {
        if (!this.isLoggedIn()) {
            return Promise.reject('RDF: Not logged in');
        } else {
            const s = $rdf.sym(subjectUri);
            const p = $rdf.sym(predicate);
            const o = $rdf.literal(object);
            const statement = $rdf.st(s, p, o, $rdf.sym(docUrl));

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

    /** Update a triple with Sparql */
    async updateTripleSparql(
        docUrl: string,
        subjectUri: string,
        predicate: string,
        oldValue: string,
        newValue: string
    ): Promise<void> {
        if (!this.isLoggedIn()) {
            return Promise.reject('RDF: Not logged in');
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
            const matches = this.store.match(null, ns.FOAF('member'), me)
                .concat(this.store.match(null, ns.SCHEMA('member'), me))
                .concat(this.store.match(null, ns.SOLID('hasMember'), me))
                .concat(this.store.match(null, ns.VCARD('hasMember'), me));

            // this.logger.info(`RFD: Matches: ${JSON.stringify(matches)}`);

            // 3. Extract unique subject URIs where you are listed as a member
            const containers = Array.from(new Set(matches.map(quad => quad.subject.value)));
            // this.logger.info(`RFD: Containers: ${JSON.stringify(containers)}`);

            // 4. Get all pim:storage triples
            const storages = this.store.each(me, ns.PIM('storage'), null);

            const pods =  storages.map(node => node.value);
            // this.logger.info(`RFD: Pods: ${JSON.stringify(pods)}`);

            return pods.concat(containers);
        } catch (error) {
            this.logger.error(`RDF: Error fetching membership data: ${error}`, );
            return [];
        }
    }

    /** Get a owner webId from the RDF store */
    getOwnerWebId(profileDocUrl: string): string {
        let returnOwner = '';
        const profileDoc = $rdf.sym(profileDocUrl);
        const triples = this.store.match(profileDoc, ns.FOAF('maker'), null);

        if (triples.length > 0) {
            returnOwner = triples[0].object.value;
        }
        return returnOwner;
    }

    /** Get a literal value */
    getLiteral(subjectUrl: string, predicateUrl: string): string | undefined {
        const subject = $rdf.sym(subjectUrl);
        const predicate = $rdf.sym(predicateUrl);
        const node = this.store.any(subject, predicate);
        return node?.termType === 'Literal' ? node.value : undefined;
    }

    /** Get a value from the RDF store */
    // getValue(subjectUrl: string | null, predicateUrl: string): string | null {
    getValue(subjectUrl: string | null, predicate: NamedNode): string | null {
        let subject = null
        if (undefined != subjectUrl) {
            subject = $rdf.sym(subjectUrl);
        }
        // const predicate = $rdf.sym(predicateUrl);
        const value = this.store.any(subject, predicate);
        return value?.value ?? null;
    }

    /** Get a maching triple from the RDF store */
    async getTriple(subject: NamedNode | null, predicate: NamedNode, object: NamedNode | $rdf.Literal | null): Promise<Quad | null> {
        if (null != subject) {
            await this.loadResource(subject);
        }
        // this.logger.info(`RDF: Triple Request: subject: ${subject?.value}, predicate ${predicate.value}, object: ${object?.value}`);    
        const triple = this.store.match(subject, predicate, object)[0];
        // this.logger.info(`RDF: Triple Match: ${triple}`);
        return triple ?? null;
    }

    /** Get matching triples from the RDF store */
    async getTriples(subjectUrl: string | null, predicate: NamedNode, objectUrl: string | null): Promise<Quad[] | null> {
        const subject = subjectUrl ? $rdf.sym(subjectUrl) : null;
        const object = objectUrl ? $rdf.sym(objectUrl) : null;

        if (undefined != subject && undefined != subjectUrl) {
            const webId = this.getOwnerWebId(subjectUrl);
            await this.loadResource(webId);
        }
        // await this.ensureLoaded(subjectUrl);

        const triples = this.store.match(subject, predicate, object);
        // this.logger.info(`RDF: Triples: ${JSON.stringify(triples)}`);
        const uniqueTriples = this.extractUniqueTriples(triples);
        // this.logger.info(`RDF: Unique Triples: ${JSON.stringify(uniqueTriples)}`);
        return uniqueTriples ? uniqueTriples : null;
    }

    /** Get statements from the RDF store */
    getStatements(subjectUrl?: string | Quad_Subject | null, predicate?: NamedNode | null, object?: string | null): $rdf.Statement[] {
        const subject = subjectUrl ? this.getNamedNode(subjectUrl) : null;
        const obj = object ? $rdf.sym(object) : null;
        return this.store.statementsMatching(subject, predicate, obj);
    }

    /** Remove statements from the RDF store */
    removeStatements(sts: readonly Quad<Quad_Subject, Quad_Predicate, Quad_Object, Quad_Graph>[]): $rdf.Store {
        const result = this.store.removeStatements(sts);
        return result;
    }

    /** Add statement to the RDF store */
    addStatement(st: Quad<Quad_Subject, Quad_Predicate, Quad_Object, Quad_Graph>) {
        const result = this.store.add(st);
    }

    /** Extract unique triples */
    private extractUniqueTriples(triples: Quad[]): Quad[] {
        return Array.from(
            new Map(
                triples.map(q => [
                    `${q.subject.value} ${q.predicate.value} ${q.object.value} ${q.graph.value}`,
                    q,
                ])
            ).values()
        );
    }

    /** Set (add/update) a value in the RDF store */
    async setValueSparql(subjectUrl: string, predicateUrl: string, value: string): Promise<void> {
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

    /** Remove a value from the GM server */
    async removeValueSparql(subjectUrl: string, predicateUrl: string): Promise<void> {
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

    async upsertValuesSparql(profileDocUrl: string, subjectUri: string, updates: IValueUpdate[]): Promise<void> {
        await this.loadResource(profileDocUrl);

        const subject = $rdf.sym(subjectUri);
        const doc = $rdf.sym(profileDocUrl);

        const deletions: $rdf.Statement[] = [];
        const insertions: $rdf.Statement[] = [];

        for (const { predicate, value, isLiteral = true, lang } of updates) {
            // const predicateNode = $rdf.sym(predicateUri);
            const predicateNode = predicate;
            const existingValue = this.store.any(subject, predicateNode, undefined, doc);

            const deletion = existingValue ? $rdf.st(subject, predicateNode, existingValue, doc) : null;
            if (undefined != deletion) {
                deletions.push(deletion);
            }

            const object = isLiteral ? $rdf.literal(value, lang) : $rdf.sym(value);
            
            insertions.push($rdf.st(subject, predicateNode, object, doc));
        }

        return new Promise<void>((resolve, reject) => {
            this.updater.update(deletions, insertions, (uri, ok, message) => {
                if (!ok) reject(new Error(message));
                else resolve();
            });
        });
    }

    async upsertValues(webId: string, subjectUri: string, updates: IValueUpdate[]): Promise<void> {
        await this.loadResource(webId);
        // const profileUrl = this.getProfileUrl(webId) ?? '';
        this.logger.info(`RDF: webId: ${webId}, updates: ${JSON.stringify(updates)}`);
        const subject = $rdf.sym(subjectUri);
        // const subject = $rdf.sym(webId);
        const doc = $rdf.sym(webId);

        const deletions: Quad[] = [];
        const insertions: Quad[] = [];

        for (const { predicate, value, isLiteral = true, lang } of updates) {
            // const predicateNode = $rdf.sym(predicateUri);
            const predicateNode = predicate;
            
            // const existingValues = await this.getTriples(subjectUri, predicateUri, null);
            const existingValues = await this.getTriples(subjectUri, predicateNode, null);
            // const existingValuesWebId = await this.getTriples(webId, predicateUri, null);
            // this.logger.info(`RDF: Existing values: ${JSON.stringify(existingValues)}`);

            if (undefined != existingValues) {
                for (let index = 0; index < existingValues.length; index++) {
                    const existingValue = existingValues[index];
                    await this.deleteQuad(existingValue, deletions);
                }
            }
            
            const object = isLiteral ? $rdf.literal(value, lang) : $rdf.sym(value);
            
            this.logger.info(`RDF: subject uri: ${webId}, predicate node: ${JSON.stringify(predicateNode)}, object: ${object}`);
            await this.addTriple(subject, predicateNode, object);
            // await this.addTriple(subjectUri, predicateNode, object);
            insertions.push($rdf.quad(subject, predicateNode, object, doc));
        }

        this.logger.info(`RDF: deletions: ${deletions}, insertions: ${insertions}`);
    }

    private async deleteQuad(value: Quad, deletions: Quad[]) {
        if (value) {
            deletions.push(value);
            const removedValue = await this.deleteTripleState(value);
            if (removedValue) {
                this.deleteTripleFromStore(value);
            }
        }
    }

    /** Acquires the profile URL in the Solid Pod. */
    getProfileUrl(webId: string): string | null {
        let profileUri = null;
        const webIdNode = $rdf.sym(webId);
        const matches = this.store.match(null, ns.FOAF('maker'), webIdNode);

        for (const triple of matches) {
            const isProfileDoc = this.store.holds(triple.subject, ns.RDF('type'), ns.FOAF('PersonalProfileDocument'));
            if (isProfileDoc) {
                profileUri = triple.subject.value; // This is the profile document URL
                break;
            }
        }
        return profileUri
    }

    /** Uploads a file to the given URL in the Solid Pod. */
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
            this.logger.error(`RDF: Image upload failed: ${res.statusText}`);
        }
        return uploadResult;
    }

    async setProfileImageSparql(webId: string, imageUrl: string): Promise<void> {
        // const profileDoc = webId.split('#')[0];
        const subjectUri = this.getProfileUrl(webId);

        if (null != subjectUri) {
            const subject = $rdf.sym(subjectUri);
            // const me = $rdf.sym(webId);
            const doc = $rdf.sym(webId);
            const predicate = ns.FOAF('img');

            await this.loadResource(webId);

            if (null != subject) {
                const existing = this.store.match(subject, predicate, null, doc) as $rdf.Statement[];
                const newStmt = $rdf.st(subject, predicate, $rdf.sym(imageUrl), doc);

                await new Promise<void>((resolve, reject) => {
                    this.updater.update(existing, [newStmt], (uri, ok, msg) => {
                    if (ok) resolve();
                    else reject(new Error(msg));
                    });
                });
            }
        }
    }

    /** Removes the foaf:img triple from the user's profile RDF. */
    async deleteProfileImageSparql(webId: string): Promise<void> {
        const subjectUri = this.getProfileUrl(webId);

        if (null != subjectUri) {
            const subject = $rdf.sym(subjectUri);
            const doc = $rdf.sym(webId);
            const predicate = ns.FOAF('img');
            await this.loadResource(webId);
            
            const existingStatements = this.store.match(subject, predicate, null, doc) as $rdf.Statement[];

            if (existingStatements.length === 0) {
                this.logger.info('RDF: No profile image found to remove.');
            } else {
                await new Promise<void>((resolve, reject) => {
                    this.updater.update(existingStatements, [], (uri, ok, message) => {
                        if (ok) resolve();
                        else reject(new Error(message));
                    });
                });
            }
        }
    }

    // /** Get all profile images. */
    // async getProfileImageUrlsContaining(webId: string, filename: string): Promise<string> {
    //     let profileImageUrl = '';
    //     const subjectUri = this.getProfileUrl(webId);
    //     if (null != subjectUri) {
    //         const subject = $rdf.sym(subjectUri);
    //         const doc = $rdf.sym(webId);

    //         await this.loadResource(webId);

    //         const predicates = [ns.FOAF('img'), ns.VCARD('photo')];

    //         for (const predicate of predicates) {
    //             const images = this.store.each(subject, predicate, null, doc)
    //             .filter((node): node is $rdf.NamedNode => node.termType === 'NamedNode');

    //             const match = images.find(node => node.value.includes(filename));
    //             if (match) {
    //                 profileImageUrl = match.value;
    //             }
    //         }
    //     }
            
    //     return profileImageUrl;
    // }

    /** List images in folder. */
    async listImagesInFolder(folderUrl: string): Promise<string[]> {
        await this.loadResource(folderUrl);

        const folder = $rdf.sym(folderUrl);
        const contents = this.store.match(folder, ns.LDP('contains'), null, folder);

        return contents
            .map(st => st.object.value)
            .filter(url => /\.(jpg|jpeg|png|gif)$/i.test(url));
    }

    async addTripleSolidPatch(subjectUrl: string, objectUrl: string): Promise<boolean> {
        let updatedNode = false;
        try {
            // Step 1: Authenticate (assumes prior login with @inrupt/solid-client-authn-browser)
            // Step 2: Create the main RDF graph for the patch
            const store = $rdf.graph();
            const subjectUri = this.getProfileUrl(subjectUrl);
            if (null != subjectUri) {
                const subject = $rdf.sym(subjectUri);
                const graph = $rdf.sym(subjectUri);
                const predicate = ns.FOAF('knows');
                const object = $rdf.sym(objectUrl);

                const patchUri = $rdf.sym(`${subjectUri}#patch`);
                
                await this.loadResource(subjectUri);

                // Step 3: Add the patch type
                store.add(patchUri, ns.RDF('type'), ns.SOLID('InsertDeletePatch'));

                // Step 4: Create a sub-graph (Formula) for the triples to insert
                const insertFormula = $rdf.graph();
                insertFormula.add(subject, predicate, object);

                // Step 5: Add the insert formula to the patch
                store.add(patchUri, ns.SOLID('inserts'), insertFormula);

                // Step 6: Serialize the patch to turtle
                const patchContent = this.serialize(graph.doc(), store, subjectUri);
                this.logger.info(`RDF: Patch: ${JSON.stringify(patchContent)}`);

                // Step 7: Send the PATCH request
                const response = await this.solidAuthService.getDefaultSession().fetch(
                    subjectUri, {
                        method: 'PATCH',
                        credentials: 'include',
                        headers: {
                            "Content-Type": "text/turtle",
                        },
                        body: patchContent,
                    }
                );

                // Step 8: Check the response
                if (response.ok) {
                    this.logger.info(`RDF: Added foaf:knows relationship to ${subjectUri}`);
                    updatedNode = true;
                } else {
                    this.logger.error(`RDF: Failed to patch profile: ${response.statusText}`);
                }
            }
        } catch (error: any) {
            this.logger.error(`RDF: Failed to add triple solid: ${error.message}`);
        } finally {
            return updatedNode
        }
    }

    async addTriple(subjectUrl: string | NamedNode, predicate: NamedNode, object: string | NamedNode | $rdf.Literal): Promise<boolean> {
        let updatedNode = false;
        try {
            // Step 1: Authenticate (assumes prior login with @inrupt/solid-client-authn-browser)
            // Step 2: Create the main RDF graph for the patch
            const store = $rdf.graph();

            const subject = this.getNamedNode(subjectUrl);
            const graph = this.getNamedNode(subjectUrl);

            // Step 3: Add the triple to the patch store
            store.add(subject, predicate, object);

            // Step 4: Serialize the store to turtle
            const patchContent = this.serialize(graph, store, this.getUri(subjectUrl));
            this.logger.info(`RDF: Patch: ${JSON.stringify(patchContent)}`);

            // Step 5: Send the PATCH request
            // const successfulFetch = await this.uploadTurtle(patchContent, this.getUri(subjectUrl));
            // if (successfulFetch) {
            //     updatedNode = true;
            //     // this.logger.info(`RDF: Patch add to store: ${subject.value}, ${predicate.value}, ${JSON.stringify(object)}`);
            //     this.store.add(subject, predicate, object);
            // }
        } catch (error: any) {
            this.logger.error(`RDF: Failed to add triple GM: ${error.message}`);
        } finally {
            return updatedNode
        }
    }

    

    async uploadTurtle(turtlebody: string | undefined, resourceUri: string) {
        let successfulFetch = false;
        // if(!resourceUri) {
        //     console.log("ERROR: URI missing for resource. Update not possible.");
        //     return;
        // }
        // resourceUri = resourceUri.replace("//i", "/i");
        try {
            const response = await this.solidAuthService.getDefaultSession().fetch(
                resourceUri,
                {
                    method: "PATCH", // Remember to use patch when writing to API
                    credentials: "include",
                    body: turtlebody,
                    headers: {
                        "Content-Type": "text/turtle",
                    }
                }
            );

            if (response.status === 200){
                // this.logger.info(`RDF: Successful fetch, got response 200`);
                successfulFetch = true;
            } else if (response.status === 201){
                // this.logger.info(`RDF: Created successfully, response 201`);
                successfulFetch = true;
            } else if (response.status === 401){
                this.logger.error(`RDF: The app is not authorized by this Trinpod.`);
                successfulFetch = false;
            } else {
                this.logger.error(`RDF: Error running fetch, got response: ${response.status}`, );
                successfulFetch = false;
            }
        } catch (error) {
            this.logger.error(error);
            successfulFetch = false;
        } finally {
            return successfulFetch;
        }
    }

    // hexToString (str: string) { // Fixes formats like //X2/something/X0/
    //     let r = /\\X2\\([\d\w]{2,4})\\X0\\/gi;
    //     str = str+"".replace(r, function (match, grp) {
    //         return String.fromCharCode(parseInt(grp, 16)); 
    //     });
    //     str = str.replace("\\X2\\00D8\\X0\\", "Ø");
    //     str = str.toString();
    //     return str;
    // }

    // formatString (str: string) {
    //     str = this.hexToString(str);
    //     str = this.decodeCharacters(str);
    //     str = this.unicodeToChar(str);
    //     str = str+"".replace(" ", "");
    //     return str;
    // }

    // decodeCharacters (str: string) {
    //     str = decodeURIComponent(str);
    //     var r = /\\u([\d\w]{4})/gi;
    //     str = str+"".replace(r, function (match, grp) {
    //         return String.fromCharCode(parseInt(grp, 16)); 
    //     });
    //     str = str.toString();
    //     return str;
    // }

    // unicodeToChar (str: string) {
    //     return str.replace(/\\u[\dA-F]{4}/gi, 
    //     function (match) {
    //         return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
    //     });
    // }

    serialize(target: $rdf.NamedNode | null, store: $rdf.Store | null, baseurl: string) {
        const resourceStore = store ? store : this.store;
        const turtleFile = $rdf.serialize(
            target,
            resourceStore,
            baseurl,
            'application/n-triples'
        );
        // const cleanTurtle = this.cleanTurtle(turtleFile);
        return turtleFile;
    }

    // cleanTurtle(turtle: string | undefined, uploadURI="./"): string | undefined {
    //     if (undefined != turtle) {
    //         turtle = turtle.replace("<./>", '<' + uploadURI.substring(0, uploadURI.lastIndexOf("/")+1)+'>');
    //         turtle = turtle.replace("<%3C", "<");
    //         turtle = turtle.replace("%3E>", ">");
    //         turtle = turtle.replaceAll('@prefix : <#>.\n', '');
    //         turtle = turtle.replaceAll("@prefix : </i#>.\n", '');
    //         turtle = turtle.replace(/(>)\n/g, '$1 '); // Replaces blank node <> characters.
    //         turtle = turtle.replace(/(>\s)\s+/g, '$1'); // Replace blank spaces after > character
    //         turtle = turtle.replace(/([^\s])([;.])\n/g, '$1 $2\n'); // Add blank spaces before split
    //         turtle = turtle.replace(/<(_:\w+)>/g, '$1'); // Replaces blank node <> characters.
    //         //turt = turt.replaceAll("^^<neo:a_matrix-3m>", "");
    //         turtle = turtle.replaceAll('^^neo:a_matrix-3m"', '"^^neo:a_matrix-3m');
    //         turtle = turtle.replace(/(\n)\n/g, '$1'); //Removes double line breaks.
    //         turtle = turtle.replace(/(m_polyline)\n\s+/g, '$1 '); //Removes line breaks before "
    //         turtle = turtle.replace(/([a-z]{3}:[A-Za-z_]+)\n\s+/g, '$1 '); //Removes line breaks before "
    //         turtle = turtle.replace(/("\d{1,4}-\d{1,2}-\d{1,2}\w\d{1,2}:\d{1,2}:\d{1,2}.\d{1,3}\w")+/g, '$1'+'^^<http://www.w3.org/2001/XMLSchema#dateTime>'); // Replace blank spaces after > character
    //         turtle = turtle.replaceAll("###", "");
    //         turtle = turtle.replaceAll('"""', '"');
    //         turtle = turtle.replaceAll('/""@', '"@');
    //         turtle = turtle.replaceAll('%25', '%'); // Prevent double encoding of %
    //         turtle = turtle.replaceAll('"^^<xsd:float>', '"^^xsd:float');
    //         turtle = this.cleanPrefixes(turtle);
    //     }
    //     return turtle;
    // }

    // cleanPrefixes (turtle: string | undefined): string | undefined{
    //     try{
    //         if (undefined != turtle) {
    //             let prefixArray = turtle.split(/\r\n|\n/);
    //             for (var i=1; i<prefixArray.length; i++) {
    //                 if (prefixArray[i].includes("@prefix")) {
    //                     let prefix = prefixArray[i].replace('@prefix ', '');
    //                     prefix = prefix.substring(0, prefix.indexOf(":")+1);
    //                     let prefixuri = prefixArray[i].substring(prefixArray[i].indexOf("<")+1, prefixArray[i].indexOf(">"));
    //                     let prefixObject = { prefix:prefix , uri:prefixuri };
    //                     // Replace all prefixes that is using the i with whole URI
    //                     turtle = turtle.replaceAll(`${prefixObject.prefix}i `,`<${prefixObject.uri}i>`);
    //                     turtle = turtle.replaceAll(`${prefixObject.prefix}y_system`,`<${prefixObject.uri}y_system>`);
    //                     turtle = turtle.replaceAll(`${prefixObject.prefix}tag`,`<${prefixObject.uri}tag>`);
    //                 }
    //             }
    //         }
            
    //     } catch (error: any){
    //         this.logger.error(`RDF: Error cleaning prefixes: ${error.message})`);
    //     } finally {
    //         return turtle;
    //     }
    // }

    async deleteTripleState(st: Quad) {
        let deleteTriple = false;
        const stateURI =  this.getStateFromTriple(st);
        if (!stateURI) {
            this.logger.info(`RDF: Triple not deleted.`);
        }
        deleteTriple = await this.deleteNode(stateURI);
        return deleteTriple;
    }

    deleteTripleFromStore(st: Quad) {
        let deleteTripleFromStore = false;
        try {
            const triplesToRemove = this.store.match(st.subject, st.predicate, st.object, st.graph);
            // this.logger.info(`RDF: Triples to remove: ${JSON.stringify(triplesToRemove)}`);
            if (triplesToRemove.length > 0) {
                this.store = this.store.removeStatements(triplesToRemove);
                deleteTripleFromStore = true;
            }
        } catch (error: any) {
            this.logger.error(`RDF: Failed to delete triple from store: ${error.message}`);
        } finally {
            return deleteTripleFromStore;
        }
    }

    async readNode(uri: string | undefined): Promise<string | null> {
        let result = null;
        const contentType =  "image/*;q=0.9, */*;q=0.1, application/rdf+xml;q=0.9, application/xhtml+xml, text/xml;q=0.5, application/xml;q=0.5, text/html;q=0.9, text/plain;q=0.5, text/n3;q=1.0, text/turtle;q=1";
        try {
            if (uri) {
                const response = await this.solidAuthService.getDefaultSession().fetch(
                    uri,
                    {
                        method: 'GET',
                        credentials: 'include',
                        headers: { Accept: contentType }
                    }
                );

                if (response.ok) {
                    // Case 1: Response has .body as a stream
                    if (response.body) {
                        const reader = response.body.getReader();
                        const decoder = new TextDecoder('utf-8');
                        let chunks: Uint8Array[] = [];

                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) {
                                break;
                            }
                            if (value) {
                                chunks.push(value);
                            }
                        }

                        const concatenated = this.concatUint8Arrays(chunks);
                        result = decoder.decode(concatenated);
                    }
                    // Case 2: Fallback if .body not available
                    else {
                        result = await response.text();
                    }
                }
            }
        } catch (error: any) {
            this.logger.error(`RDF: Failed to read: ${error.message}`);
        } finally {
            return result;
        }
    }

    private concatUint8Arrays(chunks: Uint8Array[]): Uint8Array {
        const total = chunks.reduce((a, b) => a + b.length, 0);
        const combined = new Uint8Array(total);
        let offset = 0;

        for (const chunk of chunks) {
            combined.set(chunk, offset);
            offset += chunk.length;
        }

        return combined;
    }

    async deleteNode(nodeURI: string | undefined) {
        let deletedNode = false;
        try {
            if (nodeURI) {
                this.store.match(null, null, $rdf.sym(nodeURI)).forEach(triple => {
                    this.store.removeStatement(triple);
                });
                this.store.match($rdf.sym(nodeURI), null, null).forEach(triple => {
                    this.store.removeStatement(triple);
                });
                const res = await this.solidAuthService.getDefaultSession().fetch(
                    nodeURI,
                    {
                        method: 'DELETE',
                        credentials: 'include',
                    }
                );

                if (res.ok) {
                    this.logger.info(`RDF: Node deleted: ${nodeURI}`);
                    deletedNode = true;
                } else {
                    this.logger.error(`RDF: Node not deleted: ${nodeURI}`);
                }
            }
        } catch (error: any) {
            this.logger.error(`RDF: Failed to delete: ${error.message}`);
        } finally {
            return deletedNode;
        }
    }

    getStateFromTriple(st: Quad) {
        let predicate = st.predicate;
        let subject = st.subject;
        let object = st.object;
        
        let stateURI = undefined;
        // this.logger.info(`RDF: Triple: subject: ${JSON.stringify(st.subject.value)}, predicate: ${JSON.stringify(st.predicate.value)}, object: ${JSON.stringify(st.object.value)}`);
        
        // 1. GET SUBJECT THAT HAS OBJECT WITH PREDICATE o_result = NODE
        const results = this.store.match(null, ns.NEO('o_result'), object);
        results.forEach(result => {
            // this.logger.info(`RDF: Node: ${result}`);
            // 2. VERIFY THAT NODE HAS i_function OF PREDICATE
            const node = result.subject;
            let nodeHasFunction = this.store.match(node, ns.NEO('i_function'), predicate);
            if (nodeHasFunction) {
                // this.logger.info(`RDF: Is function`);
                // 3. GET OBJECT OF NODE WITH i_attribute = STATE
                let attribute = this.store.match(node, ns.NEO('i_attribute'), null)[0];
                if(undefined != attribute) {
                    let stateNodeURI = attribute.object.value;
                    // this.logger.info(`RDF: State: ${stateNodeURI}`);
                    // 4. VERIFY THAT STATE IS type s_state
                    let isState = this.store.match($rdf.sym(stateNodeURI), ns.RDF('type'), ns.NEO('s_state'))[0];
                    // this.logger.info(`RDF: State is valid: state: ${isState}`);
                    // 5. VERIFY THAT STATE IS i_entity
                    let isEntity = this.store.match(null, ns.NEO('i_entity'), $rdf.sym(stateNodeURI))[0];
                    // this.logger.info(`RDF: State is valid: entity: ${isEntity}`);
                    if (isState && isEntity) {
                        stateURI = stateNodeURI;
                        
                    }
                }
            }
        });
        return stateURI;
    }

    getSolidAccount(webId: string): string | null {
        // this.logger.info(`RDF: Triple: subject: ${JSON.stringify(st.subject.value)}, predicate: ${JSON.stringify(st.predicate.value)}, object: ${JSON.stringify(st.object.value)}`);
        // await 
        const solidAccount = this.store.match(null, ns.RDF('type'), ns.SOLID('Account'))[0].subject.value;
        return solidAccount ?? null;
    }

    async getContacts(webId: string): Promise<Quad[]> {
        // const subject = this.extractSubjectFromProfileDocurl(webId);
        const subject = $rdf.sym(webId);
        const doc = $rdf.sym(webId);
        const predicate = ns.FOAF('knows');
        
        await this.loadResource(webId);

        const contactNodes = this.store.match(subject, predicate, null, doc);
        return contactNodes;
    }
    
    // async parseContact(personProfile: IContactProfile, person: $rdf.Node & NamedNode) {
    async getContactInfo(contactProfile: IContactProfile, contactWebId: string) {
        const contentType = 'text/turtle';
        const responseType = 'text';

        const webId = contactWebId;
        
        this.http.get(webId, {
            responseType: responseType,
            headers: { Accept: contentType }
        })
        .pipe(
            catchError(this.handleError<any>('fetchPerson', ))
        )
        .subscribe(contact => {
            // this.logger.info(`RDF: Fetched contact: ${JSON.stringify(contact)}`);
            // Parse Turtle string into the store
            $rdf.parse(contact, this.store, webId, contentType, () => {
                this.fillContactProfile(contactProfile, $rdf.sym(webId));
                // this.logger.info(`RDF: After parse: ${JSON.stringify(contactProfile)}`)
            });
        });
    }

    fillContactProfile(contactProfile: IContactProfile, webId: NamedNode) {
        contactProfile.name =
            this.getLiteralValue(webId, ns.FOAF('name')) ??
            this.getLiteralValue(webId, ns.VCARD('fn')) ??
            'Unknown';
        contactProfile.email = this.getUriValue(webId, ns.VCARD('hasEmail')) ?? '';
        contactProfile.org = this.getUriValue(webId, ns.VCARD('organization-name')) ?? '';
        contactProfile.role = this.getUriValue(webId, ns.VCARD('role')) ?? '';
        contactProfile.img =
            this.getUriValue(webId, ns.FOAF('img')) ??
            this.getUriValue(webId, ns.VCARD('photo')) ?? '';
        // this.logger.info(`RDF: Parsed contact: ${JSON.stringify(contactProfile)}`);
    }

    async loadContact(person: $rdf.Node & NamedNode) {
        //Any Data Type
        // getRepos(userName: string): Observable<any> {
        //     return this.http.get(this.baseURL + 'users/' + userName + '/repos')
        // }

        // this.http.get(person.value, this.httpOptions)
        // const baseUrl = 'https://example.org/profile/card'; 
        const contentType = 'text/turtle';
        const responseType = 'text';

        const webId = person.value;
        
        this.http.get(webId, {
            responseType: responseType,
        })
        .pipe(
            catchError(this.handleError<any>('fetchPerson', ))
        )
        .subscribe(contact => {
            this.logger.info(`RDF: Person Recevied`);
            this.logger.info(`RDF: Fetched person: ${JSON.stringify(contact)}`);
            // Parse Turtle string into the store
            $rdf.parse(contact, this.store, webId, contentType);
        });
    }

    private extractSubjectFromProfileDocurl(profileDocUrl: string): NamedNode | null {
        let subject = null;
        const subjectUri = this.getProfileUrl(profileDocUrl);
        if (null != subjectUri) {
            subject = $rdf.sym(subjectUri);
        }
        return subject;
    }

    // ACCESS CONTROL
    
    /** Fetches headers only (HEAD request) and combines access-control information. */
    async getAccessHeaders(url: string): Promise<AccessHeaders> {
        const response = await this.solidAuthService.getDefaultSession().fetch(url, {
            method: 'HEAD',
            credentials: 'include',
            headers: { Accept: 'text/turtle' }
        });

        const etag = response.headers.get('ETag') ?? undefined;
        const lastModified = response.headers.get('Last-Modified') ?? undefined;
        const accessLinks = this.extractAccessControlLinks(response);
        const wacAllow = this.extractWacAllow(response);

        const result: AccessHeaders = {
            wacAllow,
            acpUrl: accessLinks.acpUrl,
            aclUrl: accessLinks.aclUrl,
            etag,
            lastModified
        };

        return result;
    }

    /**
     * Computes the effective access rights for the current session
     * using WAC-Allow if available, falling back to ACL or ACP.
     */
    async getEffectiveAccess(url: string): Promise<EffectiveAccess> {
        const headers = await this.getAccessHeaders(url);
        const effectiveAccess: EffectiveAccess = {
            read: false,
            write: false,
            control: false,
            append: false,
            source: 'Unknown'
        };

        if (headers.wacAllow) {
            effectiveAccess.read = headers.wacAllow.user.includes('read');
            effectiveAccess.write = headers.wacAllow.user.includes('write');
            effectiveAccess.control = headers.wacAllow.user.includes('control');
            effectiveAccess.append = headers.wacAllow.user.includes('append');
            effectiveAccess.source = 'WAC-Allow';
        } else if (headers.aclUrl || headers.acpUrl) {
            // Optionally, parse ACL/ACP document here later.
            effectiveAccess.source = headers.aclUrl ? 'ACL' : 'ACP';
        }

        return effectiveAccess;
    }
    
    private extractAccessControlLinks(response: Response): { acpUrl?: string; aclUrl?: string } {
        const result: { acpUrl?: string; aclUrl?: string } = {};
        const linkHeader = response.headers.get('Link');

        if (linkHeader) {
            const links = linkHeader.split(',').map(l => l.trim());

            const acpRel = links.find(l => l.includes('rel="http://www.w3.org/ns/solid/acp#accessControl"'));
            const aclRel = links.find(l => l.includes('rel="acl"'));

            result.acpUrl = this.extractUrlFromLink(acpRel);
            result.aclUrl = this.extractUrlFromLink(aclRel);
        }

        return result;
    }

    private extractUrlFromLink(link?: string): string | undefined {
        let url: string | undefined = undefined;

        if (link) {
            const start = link.indexOf('<');
            const end = link.indexOf('>');
            if (start >= 0 && end > start) {
                url = link.substring(start + 1, end);
            }
        }

        return url;
    }

    /**  Extracts and parses the WAC-Allow header from a HTTP response. */
    private extractWacAllow(response: Response): WacAllow | undefined {
        const header = response.headers.get('WAC-Allow');

        if (!header) {
            return undefined;
        }

        const result: WacAllow = { user: [], public: [] };
        const parts = header.split(',').map(p => p.trim());

        for (const part of parts) {
            const [key, value] = part.split('=');
            if (!key || !value) {
                continue;
            }

            const cleanedKey = key.trim().toLowerCase();
            const permissions = value
                .replace(/"/g, '')
                .split(/\s+/)
                .map(v => v.trim())
                .filter(v => v.length > 0);

            if (cleanedKey === 'user') {
                result.user = permissions;
            } else if (cleanedKey === 'public') {
                result.public = permissions;
            }
        }

        return result;
    }

    /** Loads and parses a Solid ACL resource into structured authorizations. */
    async parseAclFromUrl(aclUrl: string): Promise<AgentAuthorization[]> {
        let authorizations: AgentAuthorization[] = [];
        const contentType =  "text/turtle";
        try {
            const response = await this.solidAuthService.getDefaultSession().fetch(aclUrl, {
                method: 'GET',
                credentials: 'include',
                headers: { Accept: contentType }
            });

            if (response.ok) {
                const turtleText = await response.text();
                const store = $rdf.graph();
                const mimeType = 'text/turtle';

                this.logger.info(`RDF: parse acl: ${turtleText}`);

                $rdf.parse(turtleText, store, aclUrl, mimeType);

                // Get all subjects of type acl:Authorization
                const authSubjects = store.each(null, ns.RDF('type'), ns.ACL('Authorization'));

                authorizations = authSubjects.map(subject => {
                    const subjectTerm = subject as Quad_Subject;
                    const agentWebId = store.any(subjectTerm, ns.ACL('agent'))?.value ?? null;
                    const agentClass = store.any(subjectTerm, ns.ACL('agentClass'))?.value ?? null;
                    const accessTo = store.any(subjectTerm, ns.ACL('accessTo'))?.value ?? null;
                    const defaultFor = store.any(subjectTerm, ns.ACL('default'))?.value ?? null;

                    // acl:mode can have multiple values
                    const modes = store
                        .each(subjectTerm, ns.ACL('mode'))
                        .map(term => term.value)
                        .map(v => v.replace(ns.ACL('').value, 'acl:')); // shorten

                    return {
                        agentWebId: agentWebId ?? '',
                        agentClass: agentClass ?? '',
                        accessTo: accessTo ?? '',
                        // accessTo: subject.value,
                        defaultFor: defaultFor ?? '',
                        modes: modes
                    };
                });
            } else {
                this.logger.error(`RDF: Failed to fetch ACL: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error parsing ACL RDF:', error);
        }
        return authorizations;
    }

    // HELPER FUNCTIONS
    /** Convert to quad */
    toQuad(subject: Term, predicate: Term, object: Term, graph: Term | undefined = undefined): Quad {
        const quad = $rdf.quad(subject, predicate, object, graph);
        return quad;
    }

    /** Get a named node */
    getNamedNode(node: Term | string): $rdf.NamedNode {
        // let namedNode: NamedNode;
        let namedNode = node as $rdf.NamedNode;
        // const isNamedNode = this.isNamedNode(node);
        if (undefined != node) {
            if (typeof node === "string") {
                namedNode = $rdf.sym(node as string);
            } else {
                namedNode = node as $rdf.NamedNode;
            }
        }
        return namedNode;
    }

    /** Get the uri */
    getUri(node: Term | string): string {
        let uri = '';
        if (undefined != node) {
            if (typeof node === "string") {
                uri = node;
            } else {
                uri = node.value;
            }
        }
        return uri;
    }

    /** Get all rdf:type values (as strings) for a given subject. */
    getTypes(subject: $rdf.NamedNode): string[] {
        const matches = this.store.match(subject, ns.RDF('type'), null, subject.doc());

        const types = matches
        .filter(st => st.object.termType === 'NamedNode')
        .map(st => (st.object as $rdf.NamedNode).value);

        return [...new Set(types)]; // Deduplicate
    }

    /** Check if a subject has a specific rdf:type. */
    isOfType(subject: $rdf.NamedNode, typeUri: string): boolean {
        return this.store.holds(subject, ns.RDF('type'), $rdf.sym(typeUri));
    }

    /** Check if a node is a NamedNode (IRI) */
    private isNamedNode(node: Term | string | null): node is NamedNode {
        let result = false;
        if (undefined != node && typeof node !== "string") {
            result = node.termType === 'NamedNode';
        }
        return result;
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

    public sym(value: string): $rdf.NamedNode {
        return $rdf.sym(value);
    }

    /** Parses Turtle RDF into subject–predicate–object triples using rdflib. */
    async parseTurtle(turtleText: string, baseUri: string, compact: boolean = false):
        Promise<{ subject: string; predicate: string; object: string }[]> {

        let triples: { subject: string; predicate: string; object: string }[] = [];

        try {
            const store = $rdf.graph();
            const mimeType = 'text/turtle';

            $rdf.parse(turtleText, store, baseUri, mimeType);

            if (compact) {
                triples = store.statements.map(stmt => ({
                    subject: this.compactIriple(stmt.subject.value),
                    predicate: this.compactIriple(stmt.predicate.value),
                    object: this.compactIriple(stmt.object.value)
                }));
                
            } else {
                triples = store.statements.map(stmt => ({
                    subject: stmt.subject.value,
                    predicate: stmt.predicate.value,
                    object: stmt.object.value
                }));
            }
            
        } catch (error) {
            this.logger.error(`RDF: Error parsing Turtle data: ${error}`);
        }

        return triples;
    }

    /**  Converts a full IRI into a CURIE using known prefixes.
     * Falls back to the full IRI if no match is found. */
    private compactIriple(iri: string): string {
        let compacted = iri;

        try {
            for (const [prefix, base] of Object.entries(prefixes)) {
                if (iri.startsWith(base)) {
                    compacted = iri.replace(base, `${prefix}:`);
                    break;
                }
            }
        } catch (error) {
            console.error('Error compacting IRI:', error);
        }

        return compacted;
    }

    // async getProfileData(webId: string): Promise<IProfile> {
    //     const subject = $rdf.sym(webId);
    //     await this.loadResource(webId);
    //     await this.loadResource(subject.doc());

    //     const profileData: IProfile = {
    //         webId: webId,
    //         name:
    //             this.store.any(subject, ns.FOAF('name'))?.value ||
    //             this.store.any(subject, ns.VCARD('fn'))?.value ||
    //             'Unknown',
    //         img: await this.getProfileImageUrlsContaining(webId, '/public/images/profile-picture') ?? null,
    //         org: this.store.any(subject, ns.VCARD('organization-name'))?.value || '',
    //         role: this.store.any(subject, ns.VCARD('role'))?.value || '',
    //     }

    //     return profileData;
    // }

    // async getVCardString(webId: string): Promise<string> {
    //     const subject = $rdf.sym(webId);
    //     const profile = await this.readProfile(webId);

    //     const vCardInfo = `BEGIN:VCARD
    //         VERSION:3.0
    //         FN:${profile?.name}
    //         ORG:${profile?.org}
    //         TITLE:${profile?.role}
    //         EMAIL:${profile?.email}
    //         TEL:${profile?.phone}
    //         URL:${webId}
    //         END:VCARD`;

    //     return vCardInfo;
    // }

    // async readProfile(): Promise<RdfProfile | null> {
    // async readProfile(webId: string): Promise<IProfile | null> {
    //     const subjectUri = this.getProfileUrl(webId);
    //     // const subject = $rdf.sym(subjectUri);
    //     const subject = $rdf.sym(webId);
    //     const doc = $rdf.sym(webId);
    //     // const webId = webId;
        
    //     let rdfProfile: IProfile = {
    //         webId: webId,
    //         name: '',
    //         email: '',
    //         role: '',
    //         img: '',
    //     }

    //     await this.loadResource(webId);

    //     let profileUrl = this.getProfileUrl(webId) ?? '';
    //     if ('' != profileUrl) {
    //         const ownerWebid = this.getOwnerWebId(profileUrl);
    //         rdfProfile.name = this.store.any(subject, ns.FOAF('name'))?.value ?? '';
    //         rdfProfile.email = this.store.any(subject, VCARD('hasEmail'))?.value ?? '';
    //         rdfProfile.role = this.store.any(subject, VCARD('role'))?.value ?? '';
    //         rdfProfile.org = this.store.any(subject, VCARD('organization_name'))?.value ?? '';
    //         rdfProfile.img = await this.getProfileImageUrlsContaining(webId, '/public/images/profile-picture') ?? '';
    //         // rdfProfile.photo = (this.rdfService.getLiteral(profileUrl, ns.FOAF.img) || this.rdfService.getLiteral(profileUrl, VCARD.photo)) ?? '';
    //     }
    //     this.logger.info(`RDF: Name, email, photo: ${rdfProfile.name}, ${rdfProfile.email}, ${rdfProfile.img}`);
    //     return rdfProfile;
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
    //     const person = $rdf.sym(profileUri);

    //     const name = this.store.any(person, ns.FOAF('name')) || this.store.any(person, ns.SCHEMA('name'));
    //     const friends = this.store.each(person, ns.FOAF('knows'));
    //     const projects = this.store.each(person, GMX('hasProject')); // Custom property example

    //     return {
    //         name: name?.value || 'Unknown',
    //         friends: friends.map(friend => friend.value),
    //         projects: projects.map(project => project.value)
    //     };
    // }

    // async listAllTriples(webId: string) {
    //     // List all triples
    //     const webIdDoc = webId.split('#')[0];
    //     await this.loadResource(webIdDoc);
    //     const allTriples = this.store.statementsMatching(null, null, null);

    //     allTriples.forEach(triple => {
    //         this.logger.info(triple.toNT()); // Print triple in N-Triples format
    //     });
    // }

    // async listAllTriplesAsTurtle (webId: string) {
    //     // List all triples
    //     const webIdDoc = webId.split('#')[0];
    //     await this.loadResource(webIdDoc);

    //     const triples = this.store.statementsMatching(null, null, null);
    //     triples.forEach(triple => {
    //         this.logger.info(triple.toNT()); // Print triple in N-Triples format
    //     });
    // }
    private handleError<T>(operation = 'operation', result?: T) {
        return (error: any): Observable<T> => {
      
            this.logger.error(`RDF: ${operation} failed: ${error.message}`);
        
            // Let the app keep running by returning an empty result.
            return of(result as T);
        };
    }
}


