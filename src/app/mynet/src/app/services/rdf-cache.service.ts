import { Injectable } from '@angular/core';
import { CachedGraph } from '@app/interfaces';
import * as $rdf from 'rdflib';

@Injectable({
    providedIn: 'root'
})
export class RdfCacheService {
    private cache = new Map<string, CachedGraph>();
    private fetcherOptions: { fetch: typeof fetch };

    constructor() {
        this.fetcherOptions = { fetch }; // default to unauthenticated fetch
    }

    /**
     * Injects an authenticated fetch (e.g. from a Solid OIDC session)
     * to use for all subsequent network requests.
     */
    setAuthenticatedFetch(authFetch: typeof fetch): void {
        this.fetcherOptions.fetch = authFetch;
    }

    /**
     * Retrieves an RDF store for the given resource.
     * If already cached and valid, returns the cached version.
     * Otherwise reloads from the network and updates the cache.
     */
    async getStore(url: string, forceReload = false): Promise<$rdf.Store> {
        let store: $rdf.Store | null = null;
        const cached = this.cache.get(url);

        const shouldReload =
            forceReload ||
            !cached ||
            !(await this.isCacheValid(url, cached));

        if (shouldReload) {
            const loadedGraph = await this.loadAndCache(url);
            store = loadedGraph.store;
        } else {
            store = cached.store;
        }

        return store;
    }

    /**
     * Returns metadata for a given cached resource,
     * including access control links and timestamps.
     */
    getMetadata(url: string): CachedGraph | undefined {
        const metadata = this.cache.get(url);
        return metadata;
    }

    /**
     * Clears a single cached document or the entire cache.
     */
    clear(url?: string): void {
        if (url) {
            this.cache.delete(url);
        } else {
            this.cache.clear();
        }
    }

    // ─────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────

    /**
     * Checks whether the cached resource is still valid by
     * comparing ETag and Last-Modified headers.
     */
    private async isCacheValid(url: string, cached: CachedGraph): Promise<boolean> {
        let isValid = true;

        try {
            const headResponse = await this.fetcherOptions.fetch(url, {
                method: 'HEAD',
                credentials: 'include'
            });

            const etag = headResponse.headers.get('ETag');
            const lastModified = headResponse.headers.get('Last-Modified');

            const etagChanged = etag && cached.etag && etag !== cached.etag;
            const modifiedChanged = lastModified && cached.lastModified && lastModified !== cached.lastModified;

            const fiveMinutes = 5 * 60 * 1000;
            const recentlyLoaded = Date.now() - cached.loadedAt.getTime() < fiveMinutes;

            isValid = !etagChanged && !modifiedChanged && recentlyLoaded;
        } catch {
            // If HEAD request fails, trust the cache for now.
            isValid = true;
        }

        return isValid;
    }

    /**
     * Loads an RDF document, parses it, and caches it with metadata.
     */
    private async loadAndCache(url: string): Promise<CachedGraph> {
        const store = $rdf.graph();
        const fetcher = new $rdf.Fetcher(store, this.fetcherOptions);

        await fetcher.load(url);

        const headResponse = await this.fetcherOptions.fetch(url, {
            method: 'HEAD',
            credentials: 'include'
        });

        const etag = headResponse.headers.get('ETag') ?? undefined;
        const lastModified = headResponse.headers.get('Last-Modified') ?? undefined;

        const links = this.extractAccessControlLinks(headResponse);

        const cachedGraph: CachedGraph = {
            store,
            etag,
            lastModified,
            acpUrl: links.acpUrl,
            aclUrl: links.aclUrl,
            loadedAt: new Date()
        };

        this.cache.set(url, cachedGraph);
        return cachedGraph;
    }

    /**
     * Parses Link headers to find ACP and ACL resources.
     */
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

    /**
     * Extracts a URL from a Link header value.
     */
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
}
