import { Injectable } from '@angular/core';
import { LoggerService, SolidAuthService } from '@app/services';
// import { removeUrl } from '@inrupt/solid-client';

// import rdfParser from 'rdf-parse';
import * as $rdf from 'rdflib';
import { Term } from 'rdflib/lib/tf-types';
const LDP = $rdf.Namespace('http://www.w3.org/ns/ldp#>');
const FOAF = $rdf.Namespace('http://xmlns.com/foaf/0.1/');
const XSD  = $rdf.Namespace('http://www.w3.org/2001/XMLSchema#');
const RDF = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
const RDFS = $rdf.Namespace("http://www.w3.org/2000/01/rdf-schema#");
const SCHEMA = $rdf.Namespace('http://schema.org/');
const SOLID = $rdf.Namespace('http://www.w3.org/ns/solid/terms#');



@Injectable({
    providedIn: 'root'
})
export class RdfService {
    store = $rdf.graph();
    fetcher: $rdf.Fetcher;
    updater: $rdf.UpdateManager;

    constructor(
        private logger: LoggerService,
        private solidAuthService: SolidAuthService
    ) {
        // const fetchWithAuth = this.solidAuthService.getSession().fetch;
        const fetchWithAuth = this.solidAuthService.getDefaultSession().fetch;
        this.fetcher = new $rdf.Fetcher(this.store, { fetch: fetchWithAuth });
        this.updater = new $rdf.UpdateManager(this.store);
    }

    isLoggedIn(): boolean {
        return this.solidAuthService.isLoggedIn();
    }

    createStore():$rdf.Store {
        const store = $rdf.graph();
        return store;
    }
    
    createFetcher(store: $rdf.Store) {
        const fetcher = new $rdf.Fetcher(store);
        return fetcher;
    }

    

    listData(uri: string) {
        let folder = $rdf.sym(uri);  // NOTE: Ends in a slash
        const store = this.createStore();
        const fetcher = this.createFetcher(store);

        fetcher.load(folder).then(() => {
            let files = store.any(folder, LDP('contains'));
            this.logger.info(`Files ${files}`)
        });
    }

    listFolders(uri: string) {
        let folder = $rdf.sym(`${uri}`);  // NOTE: Ends in a slash
        const store = this.createStore();
        const fetcher = this.createFetcher(store);

        fetcher.load(folder).then(() => {
            let files = store.any(folder, LDP('contains'));
            this.logger.info(`Files ${files}`)
            // files.?.forEach(file) {
            //     console.log('contains' + file);
            // }
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
        // let store = this.createStore();

        $rdf.quad(subject, predicate, object, graph)
    }

    // REVIEW
    async loadDocument(docUrl: string): Promise<$rdf.Formula | null> {
        if (!this.isLoggedIn()) {
            return null;
        } else {
            this.store = $rdf.graph();
            const fetchWithAuth = this.solidAuthService.getDefaultSession().fetch;
            this.fetcher = new $rdf.Fetcher(this.store, { fetch: fetchWithAuth });
            this.updater = new $rdf.UpdateManager(this.store);

            await this.fetcher.load(docUrl);
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

    async removeTriple(docUrl: string, subjectUri: string, predicate: string, object: string): Promise<void> {
        if (!this.isLoggedIn()) {
            return Promise.reject('Not logged in');
        } else {
            const subject = $rdf.sym(subjectUri);
        const pred = $rdf.sym(predicate);
        const obj = $rdf.literal(object);
        const statement = $rdf.st(subject, pred, obj, $rdf.sym(docUrl));

        return new Promise<void>((resolve, reject) => {
        this.updater.update([statement], [], (uri, ok, message) => {
            if (ok) resolve();
                else reject(new Error(message || 'Failed to delete triple.'));
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
            await this.fetcher.load(webIdDoc);

            // 2. Look for inverse membership (you being a member of a group/container)
            const matches = this.store.match(null, FOAF('member'), $rdf.sym(webId))
                .concat(this.store.match(null, SCHEMA('member'), $rdf.sym(webId)))
                .concat(this.store.match(null, SOLID('hasMember'), $rdf.sym(webId)));

            // 3. Extract unique subject URIs where you are listed as a member
            const containers = Array.from(new Set(matches.map(quad => quad.subject.value)));

            return containers;
        } catch (error) {
            this.logger.error(`Error fetching membership data: ${error}`, );
            return [];
        }
    }
}
