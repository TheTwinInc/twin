import * as log from 'loglevel'

const $rdf = require('rdflib')

import { Session, InMemoryStorage } from '@inrupt/solid-client-authn-browser'

window.solid = {}
window.solid.session = new Session();
window.solid.storage = InMemoryStorage


const hyperFetch = function (resource, init) {
    if (!init) {
        init = {};
    }
    if (!init.headers) {
        init.headers = {}
    }
    init.headers.hypergraph = 'U2FsdGVkX1/S0rANmPZVe3xCIXvlGoGnGudwlp4wFSMFtte++kYYPt0l4B4407c+'
    return window.solid.session.fetch(resource, init)
}

window.solid.hyperFetch = hyperFetch
window.solidFetcher = hyperFetch

const rdfStore = $rdf.graph(); //new $rdf.IndexedFormula // Make a Quad store
const rdfFetcher = new $rdf.Fetcher(rdfStore, {fetch: hyperFetch})
const rdfUpdater = new $rdf.UpdateManager(rdfStore)

log.debug('Unique quadstore initialized:',rdfStore)


export { rdfStore, $rdf, rdfFetcher, rdfUpdater, hyperFetch }