import { Injectable } from '@angular/core';
import { AgentAuthorization, AgentAccess } from '@app/interfaces';
import { LoggerService, RdfService, SolidAuthService } from '@app/services';
import { ns } from '@app/utils';
import { Quad_Subject, Term } from 'rdflib/lib/tf-types';
import { UndirectedGraph } from 'graphology';
import * as $rdf from 'rdflib';

@Injectable({
    providedIn: 'root'
})
export class AccessControlListService {

    constructor(
        private rdfService: RdfService,
        private solidAuthService: SolidAuthService,
        private logger: LoggerService,
    ) {}

    private async getAclUrl(resourceUrl: string): Promise<string> {
        const accessHeaders = await this.rdfService.getAccessHeaders(resourceUrl);
        const aclUrl = accessHeaders?.aclUrl ?? '';
        return aclUrl
    }

    async getAccess(aclUrl: string, agentWebId: string): Promise<AgentAccess | null> {
        let result = null;
        // await this.getAclUrl(aclUrl);
        // await this.rdf.load(aclUrl);
        await this.rdfService.loadResource(aclUrl);

        // const authorizations = this.rdfService.getStatements(null, ns.FOAF('Agent'), agentWebId);
        const authorizations = this.rdfService.getStatements(null, ns.ACL('agent'), agentWebId);

        if (authorizations.length) {
            const modes = new Set<string>();
        
            authorizations.forEach(auth => {
                const authSubject = auth.subject;
                const modeStatements = this.rdfService.getStatements(authSubject.value, ns.ACL('mode'));
                modeStatements.forEach(m => modes.add(m.object.value));
            });

            result =  {
                webId: agentWebId,
                read: modes.has(ns.ACL('Read').value),
                write: modes.has(ns.ACL('Write').value),
                append: modes.has(ns.ACL('Append').value),
                control: modes.has(ns.ACL('Control').value)
            };
        };
        return result;
    }

    // # Authorization for a specific agent
    // []
    //     a acl:Authorization;
    //     acl:agent <https://bob.solidpod.com/profile/card#me>;
    //     acl:accessTo <https://alice.solidpod.com/docs/report.ttl>;
    //     acl:mode acl:Read, acl:Write.

    // # Public read access
    // []
    //     a acl:Authorization;
    //     acl:agentClass acl:AuthenticatedAgent;
    //     acl:accessTo <https://alice.solidpod.com/docs/report.ttl>;
    //     acl:mode acl:Read.

    async deleteAcl(agentAuthorization: AgentAuthorization): Promise<boolean> {
        let success = false;
        try {
            const { agentWebId, agentClass, accessTo, defaultFor, modes } = agentAuthorization;

            if (undefined != accessTo) {
                const aclUrl = await this.getAclUrl(accessTo);
                const aclAuthorization = await this.rdfService.readNode(aclUrl);

                const nodeDeleted = await this.rdfService.deleteNode(aclUrl);
                if (nodeDeleted) {
                    this.logger.info(`ACL: Node deleted: ${aclUrl}`)
                } else {
                    this.logger.info(`ACL: Node not deleted: ${aclUrl}`);
                }
            }
        } catch (error) {
            this.logger.error(`ACL: Error deleting agent authorization: ${error}`, );
        } finally {
            return success;
        }
    }

    /**
     * Deletes ACL authorizations from RDF text using a local rdflib store.
     *
     * @param agentAuthorization  The agent authorization
     * @param filter   Optional filter to choose which authorizations to remove
     * @returns        The updated Turtle text after deletion
     */
    async deleteAclAuthorizations(
        agentAuthorization: AgentAuthorization,
        filter?: (auth: Term, store: $rdf.IndexedFormula) => boolean
    ): Promise<boolean> {
        let success = false;
        const store = $rdf.graph();
        const { agentWebId, agentClass, accessTo, defaultFor, modes } = agentAuthorization;

        try {
            if (undefined != accessTo) {
                const aclUrl = await this.getAclUrl(accessTo);
                const aclAuthorizations = await this.rdfService.readNode(aclUrl);

                if (aclAuthorizations) {
                    // Step 2. Parse into an rdflib store
                    $rdf.parse(aclAuthorizations, store, aclUrl, 'text/turtle');

                    // Step 3. Find all authorizations
                    const authSubjects = store.each(
                        undefined,
                        ns.RDF('type'),
                        ns.ACL('Authorization'),
                        $rdf.sym(aclUrl)
                    );

                    if (authSubjects.length === 0) {
                        this.logger.warn(`No authorizations found in ACL: ${aclUrl}`);
                    } else {
                        //  Filter the authorizations to delete
                        const toDelete = filter
                            ? authSubjects.filter(subject => filter(subject, store))
                            : authSubjects;

                        // Remove all triples belonging to the selected authorizations
                        toDelete.forEach(subject => {
                            const triples = store.statementsMatching(subject as Quad_Subject, null, null, $rdf.sym(aclUrl));
                            triples.forEach(triple => store.removeStatement(triple));
                        });

                        //  Serialize the updated ACL graph back to Turtle
                        const base = this.rdfService.getNamedNode(aclUrl);
                        const updatedAcl = this.rdfService.serialize(base, store, base) || '';
                        this.logger.info(`ACL: Updated acl: ${updatedAcl}`);

                        // Step 6. POST the updated ACL back
                        // if (updatedAcl) {
                            const putResponse = await this.solidAuthService.getDefaultSession().fetch(
                                aclUrl, {
                                    method: 'PUT',
                                    credentials: 'include',
                                    headers: {
                                        'Content-Type': 'text/turtle'
                                    },
                                    body: updatedAcl,
                                }
                            );

                            if(putResponse.ok) {
                                success = true;
                                this.logger.info(`ACL: Deleted ${toDelete.length} authorizations from ${aclUrl}`);
                            } else {
                                this.logger.error(`ACL: Failed to delete authorizations: ${putResponse.status} ${putResponse.statusText}`);
                            }
                        // }
                    }
                }
            }
        } catch (error) {
            this.logger.error(`ACL Failed to delete ACL authorizations: ${error}`);
        } finally {
            return success;
        }
    }

    async setAcl(agentAuthorization: AgentAuthorization): Promise<boolean> {
        let success = false;
        try {
            // Step 1. Fetch the current ACL
            const store = $rdf.graph();
            const { agentWebId, agentClass, accessTo, defaultFor, modes } = agentAuthorization;
            // const agent = agentAuthorization.agent;
            // const accessTo = agentAuthorization.accessTo;
            if (undefined != accessTo) {
                const aclUrl = await this.getAclUrl(accessTo);
                // const nodeDeleted = await this.rdfService.deleteNode(aclUrl);
                // if (nodeDeleted) {
                //     this.logger.info(`ACL: Node deleted: ${aclUrl}`);
                // } else {
                //     this.logger.info(`ACL: Node not deleted: ${aclUrl}`);
                // }

                const aclAuthorization = await this.rdfService.readNode(aclUrl);

                if (aclAuthorization) {
                    // Step 2. Parse into an rdflib store
                    $rdf.parse(aclAuthorization, store, aclUrl, 'text/turtle');
                    // this.logger.info(`ACL: Store old: ${JSON.stringify(store)}`);

                    // // Step 3. Check if equivalent authorization already exists
                    // const ACLModeUris = modes.map(m => ns.ACL(m).value);

                    // const existingAuths = store.each(
                    //     undefined,
                    //     ns.RDF('type'),
                    //     ns.ACL('Authorization')
                    // );

                    // let alreadyExists = false;

                    // for (const subj of existingAuths) {
                    //     const subjectTerm = subj as Quad_Subject;

                    //     const existingAgent = store.any(subjectTerm, ns.ACL('agent'))?.value;
                    //     const existingAccessTo = store.any(subjectTerm, ns.ACL('accessTo'))?.value;

                    //     if (existingAgent === agentWebId && existingAccessTo === resourceUrl) {
                    //         const existingModes = store.each(subjectTerm, ns.ACL('mode')).map(m => m.value);
                    //         const hasAllModes = ACLModeUris.every(mode => existingModes.includes(mode));

                    //         if (hasAllModes) {
                    //             alreadyExists = true;
                    //             break;
                    //         }
                    //     }
                    // }

                    // if (alreadyExists) {
                    //     console.info('Authorization already exists for', agentWebId);
                    //     return true;
                    // }
                    // Step 3. Clean up old authorizations for this agent
                    const oldAuths = await this.rdfService.getTriples(null, ns.ACL('Agent'), agentWebId);
                    if (undefined != oldAuths) {
                        oldAuths.forEach(s => this.rdfService.removeStatements(this.rdfService.getStatements(s.subject, null, null)));    
                    }
                }
                // Step 4. Create a new Authorization subject
                const authNode = $rdf.blankNode();
                
                // let agent;
                // if (undefined != agentWebId) {
                //     agent = this.rdfService.sym(agentWebId);
                // }
                


                store.add(authNode, ns.RDF('type'), ns.ACL('Authorization'));
                store.add(authNode, ns.ACL('agentClass'), ns.FOAF('Agent'));
                let agent = agentWebId ?? '';
                if ('' != agent) {
                    store.add(authNode, ns.ACL('agent'), agent);
                }
                // this.logger.info(`ACL: Agent: ${agent}`); 

                store.add(authNode, ns.ACL('accessTo'), this.rdfService.sym(accessTo));
                // store.add(authNode, ns.ACL('default'), this.rdfService.sym(accessTo));

                if (undefined != modes) {
                    if (modes.includes('read')) store.add(authNode, ns.ACL('mode'), ns.ACL('Read'));
                    if (modes.includes('write')) store.add(authNode, ns.ACL('mode'), ns.ACL('Write'));
                    if (modes.includes('append')) store.add(authNode, ns.ACL('mode'), ns.ACL('Append'));
                    if (modes.includes('control')) store.add(authNode, ns.ACL('mode'), ns.ACL('Control'));
                }

                // Step 5. Serialize back to Turtle
                const newAcl = this.rdfService.serialize(null, store, aclUrl);
                this.logger.info(`ACL: Agent authorization turtle: ${newAcl}`);    

                // Step 6. POST the updated ACL back
                success = await this.postTurtle(newAcl, aclUrl);
                // success = await this.postTurtle(newAclTurtle, aclUrl, success);
            }
            
            
        } catch (error) {
            this.logger.error(`ACL: Error adding agent authorization: ${error}`, );
        } finally {
            return success;
        }
    }

    private async postTurtle(turtleFile: string | undefined, resourceUrl: string) {
        let success = false;
        try {
            if (turtleFile) {
                const postResponse = await this.solidAuthService.getDefaultSession().fetch(
                    resourceUrl, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'text/turtle'
                    },
                    body: turtleFile,
                }
                );

                if (postResponse.ok) {
                    success = true;
                } else {
                    this.logger.error(`ACL: Failed to add ACL: ${postResponse.status} ${postResponse.statusText}`);
                }
            }
        } catch (error) {
            this.logger.error(`ACL: Unable to post turtle: ${error}`, );
        } finally {
            return success;
        }
    }
}
