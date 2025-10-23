import * as $rdf from 'rdflib';

export interface CachedGraph {
    store: $rdf.Store;
    etag?: string;
    lastModified?: string;
    acpUrl?: string;
    aclUrl?: string;
    loadedAt: Date;
}