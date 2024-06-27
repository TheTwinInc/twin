import { Injectable } from '@angular/core';
import { LoggerService } from '@app/services';
import { removeUrl } from '@inrupt/solid-client';

import rdfParser from 'rdf-parse';
import * as $rdf from 'rdflib';
import { Term } from 'rdflib/lib/tf-types';
const LDP = $rdf.Namespace('http://www.w3.org/ns/ldp#>');
const FOAF = $rdf.Namespace('http://xmlns.com/foaf/0.1/');
const XSD  = $rdf.Namespace('http://www.w3.org/2001/XMLSchema#');
const RDF = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#")
const RDFS = $rdf.Namespace("http://www.w3.org/2000/01/rdf-schema#")



@Injectable({
    providedIn: 'root'
})
export class RdfService {

    constructor(
        private logger: LoggerService,
    ) { }

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
            // files.?.forEach(file) {
            //     console.log('contains' + file);
            // }
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
}
